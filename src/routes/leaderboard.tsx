import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLeaderboard, getMatches, getMatchResults, getRevealedPredictions } from "@/lib/pool.functions";
import { Trophy, Medal, Crown, Target } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const fetchLeaderboard = useServerFn(getLeaderboard);
  const fetchMatches = useServerFn(getMatches);
  const fetchResults = useServerFn(getMatchResults);
  const fetchAllPreds = useServerFn(getRevealedPredictions);

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
    queryKey: ["revealed_predictions"],
    queryFn: fetchAllPreds,
  });

  const matchesMap = new Map((matches || []).map((m) => [m.id, m]));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="pixel-heading text-lg text-foreground sm:text-2xl">
          <span className="text-oranje">★</span> Klassement <span className="text-oranje">★</span>
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Wie voorspelt de uitslagen het beste?
        </p>
      </div>

      {/* Prize info */}
      <div className="pixel-card mb-8 overflow-hidden p-0">
        <div className="pattern-1988 px-5 py-4">
          <h2 className="pixel-heading flex items-center gap-2 text-xs text-white [text-shadow:1px_1px_0_rgb(0_0_0/0.5)]">
            <Trophy className="h-5 w-5" />
            Prijzen
          </h2>
        </div>
        <div className="p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 border-2 border-gold/60 bg-gold/10 p-4">
              <Crown className="h-6 w-6 text-gold" />
              <div>
                <div className="pixel-heading text-[0.6rem] text-gold">1e plaats</div>
                <div className="mt-1 text-sm text-muted-foreground">60% van de pot</div>
              </div>
            </div>
            <div className="flex items-center gap-3 border-2 border-border bg-muted p-4">
              <Medal className="h-6 w-6 text-muted-foreground" />
              <div>
                <div className="pixel-heading text-[0.6rem] text-foreground">2e plaats</div>
                <div className="mt-1 text-sm text-muted-foreground">30% van de pot</div>
              </div>
            </div>
            <div className="flex items-center gap-3 border-2 border-border bg-muted p-4">
              <Target className="h-6 w-6 text-muted-foreground" />
              <div>
                <div className="pixel-heading text-[0.6rem] text-foreground">Poedelprijs</div>
                <div className="mt-1 text-sm text-muted-foreground">10% van de pot</div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Inleg: €10 per persoon. Betaal via de QR-code op de poulepagina.
          </p>
        </div>
      </div>

      {/* Leaderboard table */}
      {lbLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse border-[3px] border-oranje/30 bg-card" />
          ))}
        </div>
      ) : (leaderboard || []).length === 0 ? (
        <div className="pixel-card p-8 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="pixel-heading text-[0.6rem] leading-relaxed text-muted-foreground">
            Nog niemand heeft punten.
            <br />
            Voorspel nu en word de eerste!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(leaderboard || []).map((entry, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-4 px-5 py-4 ${
                  isTop3 ? "pixel-card" : "pixel-card-flat border-oranje/40"
                }`}
              >
                <div
                  className={`pixel-heading flex h-10 w-10 items-center justify-center border-2 text-xs ${
                    rank === 1
                      ? "border-gold bg-gold/20 text-gold"
                      : rank === 2
                      ? "border-border bg-muted text-foreground"
                      : rank === 3
                      ? "border-oranje/60 bg-oranje/10 text-oranje"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {rank}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-foreground">{entry.display_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {(allPredictions || []).filter((p: { user_id: string }) => p.user_id === entry.user_id).length}{" "}
                    voorspellingen ingediend
                  </div>
                </div>
                <div className="text-right">
                  <div className="pixel-heading text-base text-oranje">{entry.points}</div>
                  <div className="text-sm text-muted-foreground">
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
          <h2 className="pixel-heading mb-5 text-sm text-foreground">Uitslagen</h2>
          <div className="space-y-4">
            {(results || []).map((result) => {
              const match = matchesMap.get(result.match_id);
              if (!match) return null;
              return (
                <div
                  key={result.id}
                  className="pixel-card-flat flex items-center justify-between border-oranje/40 px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{match.round}</span>
                    <span className="font-bold">
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
  );
}
