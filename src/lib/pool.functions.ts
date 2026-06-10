import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAppUrl, getStripeClient, ENTRY_FEE_CENTS, ENTRY_FEE_CURRENCY } from "@/lib/stripe.server";
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

// Deze accounts krijgen automatisch adminrechten bij hun eerste bezoek.
const ADMIN_EMAILS = ["janneke@campai.nl"];

const CLAIM_PREFIX = "claimed:";

export const getMatches = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("matches")
    .select("*")
    .order("sort_order");
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
export const getRevealedPredictions = createServerFn({ method: "GET" }).handler(async () => {
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
  const { data, error } = await supabaseAdmin
    .from("match_results")
    .select("*");
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

    const { error } = await supabaseAdmin
      .from("participant_payments")
      .upsert({
        user_id: context.userId,
        status: "pending",
        amount_cents: ENTRY_FEE_CENTS,
        currency: "eur",
        provider: "bunq",
        provider_reference: `${CLAIM_PREFIX}${new Date().toISOString()}`,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
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

    const { data: user, error: userErr } = await supabaseAdmin.auth.admin.getUserById(context.userId);
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

    await supabaseAdmin
      .from("participant_payments")
      .upsert({
        user_id: context.userId,
        status: "pending",
        amount_cents: ENTRY_FEE_CENTS,
        currency: ENTRY_FEE_CURRENCY,
        provider: "stripe",
        provider_reference: session.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

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

    const { error } = await context.supabase
      .from("predictions")
      .upsert({
        user_id: context.userId,
        match_id: data.match_id,
        home_score: data.home_score,
        away_score: data.away_score,
      }, { onConflict: "user_id,match_id" });
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

    const { error } = await supabaseAdmin
      .from("participant_payments")
      .upsert({
        user_id: data.user_id,
        status: data.status,
        amount_cents: ENTRY_FEE_CENTS,
        currency: "eur",
        provider: "manual",
        provider_reference: data.provider_reference || null,
        paid_at: data.status === "paid" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
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

    const { data: profiles, error: profilesErr } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name")
      .order("display_name");
    if (profilesErr) throw new Error(profilesErr.message);

    const { data: payments, error: paymentsErr } = await supabaseAdmin
      .from("participant_payments")
      .select("user_id, status, amount_cents, currency, provider_reference, paid_at");
    if (paymentsErr) throw new Error(paymentsErr.message);

    const paymentMap = new Map((payments || []).map((payment) => [payment.user_id, payment]));

    return (profiles || [])
      .map((profile) => {
        const payment = paymentMap.get(profile.id);
        const ref = payment?.provider_reference || "";
        const hasClaimed = payment?.status !== "paid" && ref.startsWith(CLAIM_PREFIX);
        return {
          user_id: profile.id,
          display_name: profile.display_name,
          status: payment?.status || "pending",
          has_claimed: hasClaimed,
          claimed_at: hasClaimed ? ref.slice(CLAIM_PREFIX.length) : null,
          amount_cents: payment?.amount_cents || ENTRY_FEE_CENTS,
          currency: payment?.currency || "eur",
          provider_reference: payment?.provider_reference || null,
          paid_at: payment?.paid_at || null,
        };
      })
      // Gemelde betalingen bovenaan, zodat de admin ze direct ziet.
      .sort((a, b) => Number(b.has_claimed) - Number(a.has_claimed));
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

    const { error } = await supabaseAdmin
      .from("match_results")
      .upsert({
        match_id: data.match_id,
        home_score: data.home_score,
        away_score: data.away_score,
      }, { onConflict: "match_id" });
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
    const { data: user, error: userErr } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (userErr) throw new Error(userErr.message);
    const email = user.user.email?.toLowerCase();
    if (!email || !ADMIN_EMAILS.includes(email)) return { isAdmin: false };

    const { error: grantErr } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: context.userId, role: "admin" },
        { onConflict: "user_id,role", ignoreDuplicates: true }
      );
    if (grantErr) throw new Error(grantErr.message);
    return { isAdmin: true };
  });

export const getLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const { data: predictions, error: predError } = await supabaseAdmin
    .from("predictions")
    .select("user_id, match_id, home_score, away_score");
  if (predError) throw new Error(predError.message);

  const { data: results, error: resError } = await supabaseAdmin
    .from("match_results")
    .select("*");
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

  for (const pred of predictions || []) {
    if (!paidUserIds.has(pred.user_id)) continue;
    const result = (results || []).find((r) => r.match_id === pred.match_id);
    if (!result) continue;

    const predHomeWins = pred.home_score > pred.away_score;
    const predAwayWins = pred.home_score < pred.away_score;
    const predDraw = pred.home_score === pred.away_score;

    const resHomeWins = result.home_score > result.away_score;
    const resAwayWins = result.home_score < result.away_score;
    const resDraw = result.home_score === result.away_score;

    const correct =
      (predHomeWins && resHomeWins) ||
      (predAwayWins && resAwayWins) ||
      (predDraw && resDraw);

    if (correct) {
      scoreMap.set(pred.user_id, (scoreMap.get(pred.user_id) || 0) + 1);
    }
  }

  const leaderboard = (profiles || [])
    .filter((p) => paidUserIds.has(p.id))
    .map((p) => ({
      user_id: p.id,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      points: scoreMap.get(p.id) || 0,
    }))
    .sort((a, b) => b.points - a.points);

  return leaderboard;
});

