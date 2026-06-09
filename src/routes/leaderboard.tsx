import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/Navbar";
import { getLeaderboard, getMatches, getMatchResults, getAllPredictions } from "@/lib/pool.functions";
import { Trophy, Medal, Crown, Target } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const fetchLeaderboard = useServerFn(getLeaderboard);
  const fetchMatches = useServerFn(getMatches);
  const fetchResults = useServerFn(getMatchResults);
  const fetchAllPreds = useServerFn(getAllPredictions);

  const { data: leaderboard, isLoading: lbLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
  });

  const { data: matches } = useQuery({
    queryKey: ["matches"],
    queryFn: fetchMatches,
  });

  const { data: results } = useQuery({
    queryKey: ["match_results"],
    queryFn: fetchResults,
  });

  const { data: allPredictions } = useQuery({
    queryKey: ["all_predictions"],
    queryFn: fetchAllPreds,
  });

  const matchResultsMap = new Map((results || []).map((r) => [r.match_id, r]));
  const matchesMap = new Map((matches || []).map((m) => [m.id, m]));

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Klassement</h1>
          <p className="mt-1 text-muted-foreground">
            Wie voorspelt de uitslagen het beste?
          </p>
        </div>

        {/* Prize info */}
        <Card className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="bg-oranje px-5 py-4 text-white">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Trophy className="h-5 w-5" />
              Prijzen
            </h2>
          </div>
          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl bg-gold/10 p-4">
                <Crown className="h-6 w-6 text-gold" />
                <div>
                  <div className="text-sm font-semibold">1e plaats</div>
                  <div className="text-xs text-muted-foreground">60% van de pot</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
                <Medal className="h-6 w-6 text-muted-foreground" />
                <div>
                  <div className="text-sm font-semibold">2e plaats</div>
                  <div className="text-xs text-muted-foreground">30% van de pot</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
                <Target className="h-6 w-6 text-muted-foreground" />
                <div>
                  <div className="text-sm font-semibold">Poedelprijs</div>
                  <div className="text-xs text-muted-foreground">10% van de pot</div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Inleg: €10 per persoon. Betaal via Tikkie aan de organisator.
            </p>
          </div>
        </Card>

        {/* Leaderboard table */}
        {lbLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : (leaderboard || []).length === 0 ? (
          <Card className="p-8 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              Nog niemand heeft punten. Voorspel nu en word de eerste!
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {(leaderboard || []).map((entry, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm ${
                    isTop3 ? "ring-1 ring-oranje/30" : ""
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                      rank === 1
                        ? "bg-gold/20 text-gold"
                        : rank === 2
                        ? "bg-muted text-muted-foreground"
                        : rank === 3
                        ? "bg-oranje/10 text-oranje-dark"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {rank}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{entry.display_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(allPredictions || []).filter((p) => p.user_id === entry.user_id).length}{" "}
                      voorspellingen ingediend
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-oranje">{entry.points}</div>
                    <div className="text-xs text-muted-foreground">
                      punt{entry.points !== 1 ? "en" : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Match results overview */}
        {(results || []).length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-foreground">Uitslagen</h2>
            <div className="space-y-3">
              {(results || []).map((result) => {
                const match = matchesMap.get(result.match_id);
                if (!match) return null;
                return (
                  <div
                    key={result.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{match.round}</span>
                      <span className="font-semibold">
                        {match.home_team} {result.home_score} - {result.away_score}{" "}
                        {match.away_team}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
