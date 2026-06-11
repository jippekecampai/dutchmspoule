import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLeaderboard, getMatches, getMatchResults, getGameHighscores } from "@/lib/pool.functions";
import { Trophy, Medal, Crown, Target, Gamepad2 } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const fetchLeaderboard = useServerFn(getLeaderboard);
  const fetchMatches = useServerFn(getMatches);
  const fetchResults = useServerFn(getMatchResults);

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

  const fetchHighscores = useServerFn(getGameHighscores);
  const { data: highscores } = useQuery({
    queryKey: ["game_highscores"],
    queryFn: fetchHighscores,
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
        {(results || []).length === 0 && (
          <p className="mt-1 text-sm text-muted-foreground/70">
            Nog geen wedstrijden gespeeld — punten verschijnen na de eerste uitslag.
          </p>
        )}
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
            Inleg: €15 per persoon. Betaal via de QR-code op de poulepagina.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Alle inleg gaat in de pot en wordt volledig uitgekeerd aan de winnaars — niemand houdt er
            iets aan over. Zie de{" "}
            <Link to="/uitleg" className="underline hover:text-foreground">
              uitleg
            </Link>{" "}
            voor een voorbeeld.
          </p>
        </div>
      </div>

      {/* Puntentelling-uitleg */}
      <div className="pixel-card mb-8 overflow-hidden p-0">
        <div className="pattern-1988 px-5 py-4">
          <h2 className="pixel-heading flex items-center gap-2 text-xs text-white [text-shadow:1px_1px_0_rgb(0_0_0/0.5)]">
            <Target className="h-5 w-5" />
            Hoe werken de punten?
          </h2>
        </div>
        <div className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 border-2 border-green-500/50 bg-green-500/10 p-4">
              <div className="pixel-heading shrink-0 text-base text-green-400">+3</div>
              <div>
                <div className="pixel-heading text-[0.6rem] text-foreground">Exacte uitslag</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Je voorspelde de exact goede stand, bijv. 2-1 voorspeld én 2-1 geëindigd.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-2 border-oranje/50 bg-oranje/10 p-4">
              <div className="pixel-heading shrink-0 text-base text-oranje">+1</div>
              <div>
                <div className="pixel-heading text-[0.6rem] text-foreground">Juiste uitslag</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  De winnaar (of gelijkspel) klopt, maar niet de exacte score. Bijv. 3-0 voorspeld, 2-1 geëindigd.
                </div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Punten stapelen niet: een exacte uitslag levert 3 punten op (niet 3 + 1). Een misser
            geeft 0 punten. Wie aan het eind de meeste punten heeft, wint de pot.
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
                    {entry.predictions_count} voorspelling{entry.predictions_count !== 1 ? "en" : ""} ingediend
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

      {/* Arcade hi-scores van het mini-spelletje */}
      <div className="pixel-card mt-10 overflow-hidden p-0">
        <div className="pattern-1988 px-5 py-4">
          <h2 className="pixel-heading flex items-center gap-2 text-xs text-white [text-shadow:1px_1px_0_rgb(0_0_0/0.5)]">
            <Gamepad2 className="h-5 w-5" />
            Arcade Hi-Scores
          </h2>
        </div>
        <div className="p-5">
          {(highscores || []).length === 0 ? (
            <p className="pixel-heading text-center text-[0.6rem] leading-relaxed text-muted-foreground">
              Nog geen hi-scores.
              <br />
              Wees de eerste!
            </p>
          ) : (
            <ul className="divide-y divide-oranje/20">
              {(highscores || []).map((entry, index) => {
                const rank = index + 1;
                return (
                  <li key={entry.user_id} className="flex items-center gap-4 py-2.5">
                    <span
                      className={`pixel-heading w-8 text-center text-xs ${
                        rank === 1 ? "text-gold" : rank <= 3 ? "text-oranje" : "text-muted-foreground"
                      }`}
                    >
                      {rank}
                    </span>
                    <span className="flex-1 truncate font-bold text-foreground">
                      {entry.display_name}
                    </span>
                    {entry.opponent && (
                      <span className="hidden text-sm text-muted-foreground sm:inline">
                        vs {entry.opponent}
                      </span>
                    )}
                    <span className="pixel-heading text-xs text-foreground">
                      {entry.goals_for}-{entry.goals_against}
                    </span>
                    <span
                      className={`pixel-heading w-12 text-right text-xs ${
                        entry.saldo > 0 ? "text-oranje" : "text-muted-foreground"
                      }`}
                    >
                      {entry.saldo > 0 ? `+${entry.saldo}` : entry.saldo}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Versla de nummer 1 in het{" "}
            <Link to="/" className="underline hover:text-foreground">
              8-bit spelletje op de homepage
            </Link>
            . Je beste doelsaldo telt.
          </p>
        </div>
      </div>

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
