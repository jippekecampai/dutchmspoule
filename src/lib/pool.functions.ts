import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ScoreSchema = z.object({
  match_id: z.string().uuid(),
  home_score: z.number().int().min(0).max(50),
  away_score: z.number().int().min(0).max(50),
});

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

// Only returns predictions for matches that already have a final result.
// This prevents leaking other players' picks before kick-off.
export const getRevealedPredictions = createServerFn({ method: "GET" }).handler(async () => {
  const { data: results, error: resErr } = await supabaseAdmin
    .from("match_results")
    .select("match_id");
  if (resErr) throw new Error(resErr.message);
  const revealedIds = (results || []).map((r) => r.match_id);
  if (revealedIds.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from("predictions")
    .select("match_id, home_score, away_score, user_id, profiles:user_id(display_name)")
    .in("match_id", revealedIds);
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

export const savePrediction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ScoreSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Block predictions after kick-off
    const { data: match, error: matchErr } = await supabaseAdmin
      .from("matches")
      .select("match_date")
      .eq("id", data.match_id)
      .maybeSingle();
    if (matchErr) throw new Error(matchErr.message);
    if (!match) throw new Error("Wedstrijd niet gevonden");
    if (new Date(match.match_date).getTime() <= Date.now()) {
      throw new Error("De wedstrijd is al begonnen — voorspelling vergrendeld.");
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
    return { isAdmin: !!data };
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

  const scoreMap = new Map<string, number>();

  for (const pred of predictions || []) {
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
    .map((p) => ({
      user_id: p.id,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      points: scoreMap.get(p.id) || 0,
    }))
    .sort((a, b) => b.points - a.points);

  return leaderboard;
});
