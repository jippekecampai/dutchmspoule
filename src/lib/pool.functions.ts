import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export const getAllPredictions = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("predictions")
    .select("*, profiles:user_id(display_name)");
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

export const getProfiles = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*");
  if (error) throw new Error(error.message);
  return data || [];
});

export const savePrediction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { match_id: string; home_score: number; away_score: number }) => data)
  .handler(async ({ data, context }) => {
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
  .inputValidator((data: { match_id: string; home_score: number; away_score: number }) => data)
  .handler(async ({ data }) => {
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

export const getLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const { data: predictions, error: predError } = await supabaseAdmin
    .from("predictions")
    .select("*");
  if (predError) throw new Error(predError.message);

  const { data: results, error: resError } = await supabaseAdmin
    .from("match_results")
    .select("*");
  if (resError) throw new Error(resError.message);

  const { data: profiles, error: profError } = await supabaseAdmin
    .from("profiles")
    .select("*");
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
