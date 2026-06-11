import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getAppUrl,
  getStripeClient,
  ENTRY_FEE_CENTS,
  ENTRY_FEE_CURRENCY,
} from "@/lib/stripe.server";
import { getServerConfig } from "@/lib/config.server";
import { z } from "zod";

const ScoreSchema = z.object({
  match_id: z.string().uuid(),
  home_score: z.number().int().min(0).max(50),
  away_score: z.number().int().min(0).max(50),
});

const PaymentStatusSchema = z.object({
  user_id: z.string().uuid(),
  status: z.enum(["pending", "paid", "refunded", "failed"]),
  provider_reference: z.string().trim().max(200).optional(),
});

const PREDICTION_LOCK_MINUTES = 10;

// Puntentelling: exacte uitslag levert 3 punten op, een juiste uitkomst
// (winst thuis / gelijk / winst uit) zonder exacte score 1 punt.
export const POINTS_EXACT = 3;
export const POINTS_OUTCOME = 1;

type ScoreLike = { home_score: number; away_score: number };

export function scorePrediction(pred: ScoreLike, result: ScoreLike): number {
  if (pred.home_score === result.home_score && pred.away_score === result.away_score) {
    return POINTS_EXACT;
  }
  const predOutcome = Math.sign(pred.home_score - pred.away_score);
  const resOutcome = Math.sign(result.home_score - result.away_score);
  return predOutcome === resOutcome ? POINTS_OUTCOME : 0;
}

// Deze accounts krijgen automatisch adminrechten bij hun eerste bezoek.
const ADMIN_EMAILS = ["janneke@campai.nl", "jippeke98@gmail.com"];

const CLAIM_PREFIX = "claimed:";

type AuthUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

function deriveDisplayName(user: AuthUserLike) {
  const meta = user.user_metadata || {};
  return (
    (meta.display_name as string) ||
    (meta.full_name as string) ||
    (meta.name as string) ||
    user.email?.split("@")[0] ||
    "Speler"
  );
}

// OAuth-registraties (Google/Apple) krijgen geen profielrij via een trigger;
// maak er hier alsnog één aan zodat admin-overzicht en klassement ze zien.
async function ensureProfile(userId: string) {
  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (existingErr) throw new Error(existingErr.message);
  if (existing) return;

  const { data: user, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (userErr) throw new Error(userErr.message);

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId, display_name: deriveDisplayName(user.user) }, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

export const getMatches = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("matches").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return data || [];
});

export const getPredictions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("predictions")
      .select("*")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return data || [];
  });

// Only returns predictions for matches that already have a final result,
// and only for users whose payment has been approved by an admin.
export const getRevealedPredictions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleErr } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Alleen admins kunnen betaalde voorspellingen bekijken.");

    const { data: results, error: resErr } = await supabaseAdmin
      .from("match_results")
      .select("match_id");
    if (resErr) throw new Error(resErr.message);
    const revealedIds = (results || []).map((r) => r.match_id);
    if (revealedIds.length === 0) return [];

    const { data: paidRows, error: paidErr } = await supabaseAdmin
      .from("participant_payments")
      .select("user_id")
      .eq("status", "paid");
    if (paidErr) throw new Error(paidErr.message);
    const paidUserIds = (paidRows || []).map((p) => p.user_id);
    if (paidUserIds.length === 0) return [];

    const { data, error } = await supabaseAdmin
      .from("predictions")
      .select("match_id, home_score, away_score, user_id, profiles:user_id(display_name)")
      .in("match_id", revealedIds)
      .in("user_id", paidUserIds);
    if (error) throw new Error(error.message);
    return data || [];
  });

export const getMatchResults = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("match_results").select("*");
  if (error) throw new Error(error.message);
  return data || [];
});

export const getParticipationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("participant_payments")
      .select("status, amount_cents, currency, provider, provider_reference, paid_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const ref = data?.provider_reference || "";
    const hasClaimed = data?.status !== "paid" && ref.startsWith(CLAIM_PREFIX);

    return {
      isPaid: data?.status === "paid",
      status: data?.status || "pending",
      hasClaimed,
      claimedAt: hasClaimed ? ref.slice(CLAIM_PREFIX.length) : null,
      amountCents: data?.amount_cents || ENTRY_FEE_CENTS,
      currency: data?.currency || "eur",
      provider: data?.provider || "manual",
      paidAt: data?.paid_at || null,
    };
  });

// Deelnemer meldt zelf dat de inleg is overgemaakt; de admin bevestigt daarna.
export const claimPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: existing, error: existingErr } = await supabaseAdmin
      .from("participant_payments")
      .select("status")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existingErr) throw new Error(existingErr.message);
    if (existing?.status === "paid") return { success: true, alreadyPaid: true };

    await ensureProfile(context.userId);

    const { error } = await supabaseAdmin.from("participant_payments").upsert(
      {
        user_id: context.userId,
        status: "pending",
        amount_cents: ENTRY_FEE_CENTS,
        currency: "eur",
        provider: "bunq",
        provider_reference: `${CLAIM_PREFIX}${new Date().toISOString()}`,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { success: true, alreadyPaid: false };
  });

export const createEntryFeeCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: existingPayment, error: existingPaymentErr } = await supabaseAdmin
      .from("participant_payments")
      .select("status")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existingPaymentErr) throw new Error(existingPaymentErr.message);
    if (existingPayment?.status === "paid") {
      return { url: "/poule" };
    }

    const { data: user, error: userErr } = await supabaseAdmin.auth.admin.getUserById(
      context.userId,
    );
    if (userErr) throw new Error(userErr.message);

    const stripe = getStripeClient();
    const appUrl = getAppUrl();
    const { stripeEntryFeePriceId } = getServerConfig();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${appUrl}/poule?payment=success`,
      cancel_url: `${appUrl}/poule?payment=cancelled`,
      customer_email: user.user.email || undefined,
      client_reference_id: context.userId,
      metadata: {
        user_id: context.userId,
        purpose: "wk_poule_entry_fee",
      },
      line_items: [
        stripeEntryFeePriceId
          ? {
              price: stripeEntryFeePriceId,
              quantity: 1,
            }
          : {
              price_data: {
                currency: ENTRY_FEE_CURRENCY,
                product_data: {
                  name: "DutchMSP WK Poule deelname",
                },
                unit_amount: ENTRY_FEE_CENTS,
              },
              quantity: 1,
            },
      ],
    });

    if (!session.url) throw new Error("Stripe Checkout session heeft geen URL teruggegeven.");

    await supabaseAdmin.from("participant_payments").upsert(
      {
        user_id: context.userId,
        status: "pending",
        amount_cents: ENTRY_FEE_CENTS,
        currency: ENTRY_FEE_CURRENCY,
        provider: "stripe",
        provider_reference: session.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    return { url: session.url };
  });

export const savePrediction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ScoreSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Block predictions 10 minutes before kick-off.
    const { data: match, error: matchErr } = await supabaseAdmin
      .from("matches")
      .select("match_date")
      .eq("id", data.match_id)
      .maybeSingle();
    if (matchErr) throw new Error(matchErr.message);
    if (!match) throw new Error("Wedstrijd niet gevonden");
    const lockAt = new Date(match.match_date).getTime() - PREDICTION_LOCK_MINUTES * 60 * 1000;
    if (lockAt <= Date.now()) {
      throw new Error("Voorspellingen sluiten 10 minuten voor aanvang van de wedstrijd.");
    }

    await ensureProfile(context.userId);

    const { error } = await context.supabase.from("predictions").upsert(
      {
        user_id: context.userId,
        match_id: data.match_id,
        home_score: data.home_score,
        away_score: data.away_score,
      },
      { onConflict: "user_id,match_id" },
    );
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const markParticipantPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => PaymentStatusSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleErr } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Alleen admins kunnen betaalstatussen aanpassen.");

    const { error } = await supabaseAdmin.from("participant_payments").upsert(
      {
        user_id: data.user_id,
        status: data.status,
        amount_cents: ENTRY_FEE_CENTS,
        currency: "eur",
        provider: "manual",
        provider_reference: data.provider_reference || null,
        paid_at: data.status === "paid" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getParticipantPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleErr } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Alleen admins kunnen deelnemers bekijken.");

    // Alle accounts uit auth zijn de bron van waarheid: gebruikers die via
    // Google/Apple binnenkwamen hebben geen profielrij, maar tellen wel mee.
    const allUsers: AuthUserLike[] = [];
    let page = 1;
    for (;;) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error(error.message);
      allUsers.push(...data.users);
      if (data.users.length < 200) break;
      page++;
    }

    const { data: profiles, error: profilesErr } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name");
    if (profilesErr) throw new Error(profilesErr.message);
    const profileMap = new Map((profiles || []).map((p) => [p.id, p.display_name]));

    // Ontbrekende profielen meteen aanvullen, zodat ook het klassement ze kent.
    const missing = allUsers.filter((u) => !profileMap.has(u.id));
    if (missing.length > 0) {
      const rows = missing.map((u) => ({ id: u.id, display_name: deriveDisplayName(u) }));
      const { error: healErr } = await supabaseAdmin
        .from("profiles")
        .upsert(rows, { onConflict: "id" });
      if (healErr) throw new Error(healErr.message);
      for (const row of rows) profileMap.set(row.id, row.display_name);
    }

    const { data: payments, error: paymentsErr } = await supabaseAdmin
      .from("participant_payments")
      .select("user_id, status, amount_cents, currency, provider_reference, paid_at");
    if (paymentsErr) throw new Error(paymentsErr.message);

    const paymentMap = new Map((payments || []).map((payment) => [payment.user_id, payment]));

    return (
      allUsers
        .map((user) => {
          const payment = paymentMap.get(user.id);
          const ref = payment?.provider_reference || "";
          const hasClaimed = payment?.status !== "paid" && ref.startsWith(CLAIM_PREFIX);
          return {
            user_id: user.id,
            display_name: profileMap.get(user.id) || deriveDisplayName(user),
            email: user.email || null,
            status: payment?.status || "pending",
            has_claimed: hasClaimed,
            claimed_at: hasClaimed ? ref.slice(CLAIM_PREFIX.length) : null,
            amount_cents: payment?.amount_cents || ENTRY_FEE_CENTS,
            currency: payment?.currency || "eur",
            provider_reference: payment?.provider_reference || null,
            paid_at: payment?.paid_at || null,
          };
        })
        // Gemelde betalingen bovenaan, daarna alfabetisch.
        .sort(
          (a, b) =>
            Number(b.has_claimed) - Number(a.has_claimed) ||
            a.display_name.localeCompare(b.display_name),
        )
    );
  });

export const saveMatchResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ScoreSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Verify admin role server-side (UI placement is not security)
    const { data: isAdmin, error: roleErr } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Alleen admins kunnen uitslagen invoeren.");

    const { error } = await supabaseAdmin.from("match_results").upsert(
      {
        match_id: data.match_id,
        home_score: data.home_score,
        away_score: data.away_score,
      },
      { onConflict: "match_id" },
    );
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    if (data) return { isAdmin: true };

    // E-mails op de allowlist krijgen de adminrol automatisch toegekend.
    const { data: user, error: userErr } = await supabaseAdmin.auth.admin.getUserById(
      context.userId,
    );
    if (userErr) throw new Error(userErr.message);
    const email = user.user.email?.toLowerCase();
    if (!email || !ADMIN_EMAILS.includes(email)) return { isAdmin: false };

    const { error: grantErr } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: context.userId, role: "admin" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
    if (grantErr) throw new Error(grantErr.message);
    return { isAdmin: true };
  });

const ParticipantNameSchema = z.object({
  user_id: z.string().uuid(),
  display_name: z.string().trim().min(1, "Vul een naam in.").max(40),
});

// Admin kan de weergavenaam van een deelnemer rechtzetten — handig wanneer
// OAuth (m.n. Apple private relay) alleen een onleesbare e-mailprefix oplevert.
export const setParticipantName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ParticipantNameSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleErr } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Alleen admins kunnen namen aanpassen.");

    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: data.user_id, display_name: data.display_name }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const { data: predictions, error: predError } = await supabaseAdmin
    .from("predictions")
    .select("user_id, match_id, home_score, away_score");
  if (predError) throw new Error(predError.message);

  const { data: results, error: resError } = await supabaseAdmin.from("match_results").select("*");
  if (resError) throw new Error(resError.message);

  const { data: profiles, error: profError } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, avatar_url");
  if (profError) throw new Error(profError.message);

  // Only paid users count for the leaderboard.
  const { data: paidRows, error: paidErr } = await supabaseAdmin
    .from("participant_payments")
    .select("user_id")
    .eq("status", "paid");
  if (paidErr) throw new Error(paidErr.message);
  const paidUserIds = new Set((paidRows || []).map((p) => p.user_id));

  const scoreMap = new Map<string, number>();
  // Aantal ingediende voorspellingen per speler; de scores zelf blijven
  // verborgen tot de wedstrijd een uitslag heeft.
  const predictionCountMap = new Map<string, number>();

  for (const pred of predictions || []) {
    if (!paidUserIds.has(pred.user_id)) continue;
    predictionCountMap.set(pred.user_id, (predictionCountMap.get(pred.user_id) || 0) + 1);
    const result = (results || []).find((r) => r.match_id === pred.match_id);
    if (!result) continue;

    const gained = scorePrediction(pred, result);
    if (gained > 0) {
      scoreMap.set(pred.user_id, (scoreMap.get(pred.user_id) || 0) + gained);
    }
  }

  const leaderboard = (profiles || [])
    .filter((p) => paidUserIds.has(p.id))
    .map((p) => ({
      user_id: p.id,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      points: scoreMap.get(p.id) || 0,
      predictions_count: predictionCountMap.get(p.id) || 0,
    }))
    .sort((a, b) => b.points - a.points);

  return leaderboard;
});

// ---- Mini-game highscores ----

const GameScoreSchema = z.object({
  goals_for: z.number().int().min(0).max(99),
  goals_against: z.number().int().min(0).max(99),
  opponent: z.string().trim().max(40).optional(),
});

function gameSaldo(row: { goals_for: number; goals_against: number }) {
  return row.goals_for - row.goals_against;
}

// Slaat het resultaat op als persoonlijk record wanneer het beter is dan het
// vorige (hoger doelsaldo, bij gelijk saldo meer goals).
export const submitGameScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => GameScoreSchema.parse(data))
  .handler(async ({ data, context }) => {
    await ensureProfile(context.userId);

    const { data: existing, error: existingErr } = await supabaseAdmin
      .from("game_highscores")
      .select("goals_for, goals_against")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existingErr) throw new Error(existingErr.message);

    const improved =
      !existing ||
      gameSaldo(data) > gameSaldo(existing) ||
      (gameSaldo(data) === gameSaldo(existing) && data.goals_for > existing.goals_for);

    if (improved) {
      const { error } = await supabaseAdmin.from("game_highscores").upsert(
        {
          user_id: context.userId,
          goals_for: data.goals_for,
          goals_against: data.goals_against,
          opponent: data.opponent || null,
          achieved_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (error) throw new Error(error.message);
    }

    return {
      improved,
      best: improved ? { goals_for: data.goals_for, goals_against: data.goals_against } : existing,
    };
  });

export const getGameHighscores = createServerFn({ method: "GET" }).handler(async () => {
  const { data: scores, error } = await supabaseAdmin
    .from("game_highscores")
    .select("user_id, goals_for, goals_against, opponent, achieved_at");
  if (error) throw new Error(error.message);

  const { data: profiles, error: profErr } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name");
  if (profErr) throw new Error(profErr.message);
  const nameMap = new Map((profiles || []).map((p) => [p.id, p.display_name]));

  return (scores || [])
    .map((s) => ({
      user_id: s.user_id,
      display_name: nameMap.get(s.user_id) || "Speler",
      goals_for: s.goals_for,
      goals_against: s.goals_against,
      saldo: s.goals_for - s.goals_against,
      opponent: s.opponent,
      achieved_at: s.achieved_at,
    }))
    .sort(
      (a, b) =>
        b.saldo - a.saldo ||
        b.goals_for - a.goals_for ||
        new Date(a.achieved_at).getTime() - new Date(b.achieved_at).getTime(),
    )
    .slice(0, 10);
});

// ---- Opmerkingen / vragen (feedback) ----

const FeedbackSchema = z.object({
  message: z.string().trim().min(1, "Schrijf eerst je opmerking.").max(2000),
});

const FeedbackStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "done"]),
});

export const submitFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => FeedbackSchema.parse(data))
  .handler(async ({ data, context }) => {
    await ensureProfile(context.userId);
    const { error } = await supabaseAdmin
      .from("feedback")
      .insert({ user_id: context.userId, message: data.message });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getFeedback = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleErr } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Alleen admins kunnen opmerkingen bekijken.");

    const { data: rows, error } = await supabaseAdmin
      .from("feedback")
      .select("id, user_id, message, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name");
    if (profErr) throw new Error(profErr.message);
    const nameMap = new Map((profiles || []).map((p) => [p.id, p.display_name]));

    return (rows || []).map((r) => ({
      ...r,
      display_name: nameMap.get(r.user_id) || "Speler",
    }));
  });

export const setFeedbackStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => FeedbackStatusSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleErr } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Alleen admins kunnen opmerkingen afhandelen.");

    const { error } = await supabaseAdmin
      .from("feedback")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
