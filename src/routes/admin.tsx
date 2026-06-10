import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMatches, getMatchResults, saveMatchResult, checkIsAdmin, getParticipantPayments, markParticipantPayment } from "@/lib/pool.functions";
import { Save, Lock, CreditCard, CheckCircle2, XCircle, HandCoins } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const queryClient = useQueryClient();
  const fetchMatches = useServerFn(getMatches);
  const fetchResults = useServerFn(getMatchResults);
  const saveResult = useServerFn(saveMatchResult);
  const fetchIsAdmin = useServerFn(checkIsAdmin);
  const fetchParticipants = useServerFn(getParticipantPayments);
  const markPayment = useServerFn(markParticipantPayment);

  const { data: adminCheck, isLoading: adminLoading } = useQuery({
    queryKey: ["is_admin"],
    queryFn: fetchIsAdmin,
    retry: false,
  });

  const { data: matches } = useQuery({
    queryKey: ["matches"],
    queryFn: fetchMatches,
  });

  const { data: results } = useQuery({
    queryKey: ["match_results"],
    queryFn: fetchResults,
  });

  const { data: participants } = useQuery({
    queryKey: ["participant_payments"],
    queryFn: fetchParticipants,
    enabled: !!adminCheck?.isAdmin,
  });

  const resultsMap = new Map((results || []).map((r) => [r.match_id, r]));

  const saveMutation = useMutation({
    mutationFn: saveResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match_results"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success("Uitslag opgeslagen!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const paymentMutation = useMutation({
    mutationFn: markPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participant_payments"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success("Betaalstatus bijgewerkt");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="pixel-heading text-base text-foreground sm:text-xl">Admin — Uitslagen</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Voer hier de uitslagen in na elke wedstrijd.
        </p>
      </div>

      {adminLoading ? (
        <div className="pixel-card p-8 text-center text-muted-foreground">Controleren...</div>
      ) : !adminCheck?.isAdmin ? (
        <div className="pixel-card p-8 text-center">
          <Lock className="mx-auto mb-3 h-10 w-10 text-oranje" />
          <h2 className="pixel-heading mb-3 text-xs">Geen toegang</h2>
          <p className="text-muted-foreground">
            Alleen admins kunnen uitslagen invoeren. Vraag de organisator om je admin-rechten te geven.
          </p>
        </div>
      ) : (
        <>
          <div className="pixel-card-flat mb-6 border-oranje/40 p-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-oranje" />
              <span>Je bent ingelogd als admin.</span>
            </div>
          </div>

          <div className="pixel-card mb-8 overflow-hidden p-0">
            <div className="pattern-1988 px-5 py-3">
              <h2 className="pixel-heading flex items-center gap-2 text-[0.65rem] text-white [text-shadow:1px_1px_0_rgb(0_0_0/0.5)]">
                <CreditCard className="h-5 w-5" />
                Deelnamebetalingen
              </h2>
            </div>
            <div className="p-5">
              {(participants || []).length === 0 ? (
                <p className="text-muted-foreground">Nog geen geregistreerde deelnemers.</p>
              ) : (
                <div className="space-y-4">
                  {(participants || []).map((participant) => {
                    const isPaid = participant.status === "paid";
                    const hasClaimed = !isPaid && participant.has_claimed;
                    return (
                      <div
                        key={participant.user_id}
                        className={`flex flex-col gap-3 border-2 p-4 sm:flex-row sm:items-center sm:justify-between ${
                          hasClaimed ? "border-gold bg-gold/10" : "border-oranje/30"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-foreground">{participant.display_name}</div>
                          {participant.email && (
                            <div className="break-all text-sm text-muted-foreground">{participant.email}</div>
                          )}
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            {isPaid ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            ) : hasClaimed ? (
                              <HandCoins className="h-3.5 w-3.5 text-gold" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            {isPaid
                              ? "Betaald"
                              : hasClaimed
                              ? `Zegt betaald te hebben${participant.claimed_at ? ` (${new Date(participant.claimed_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })})` : ""} — bevestigen?`
                              : "Nog niet betaald"}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            size="sm"
                            className="pixel-btn bg-oranje text-primary-foreground hover:bg-oranje-dark"
                            disabled={paymentMutation.isPending || isPaid}
                            onClick={() =>
                              paymentMutation.mutate({
                                data: { user_id: participant.user_id, status: "paid" },
                              })
                            }
                          >
                            Markeer betaald
                          </Button>
                          <Button
                            size="sm"
                            className="pixel-btn bg-secondary text-foreground hover:bg-accent"
                            disabled={paymentMutation.isPending || !isPaid}
                            onClick={() =>
                              paymentMutation.mutate({
                                data: { user_id: participant.user_id, status: "pending" },
                              })
                            }
                          >
                            Zet open
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {(matches || []).map((match) => (
              <ResultCard
                key={match.id}
                match={match}
                existing={resultsMap.get(match.id)}
                onSave={(home, away) =>
                  saveMutation.mutate({
                    data: { match_id: match.id, home_score: home, away_score: away },
                  })
                }
                isSaving={saveMutation.isPending}
              />
            ))}
          </div>
        </>
      )}

      <p className="mt-8 text-center text-muted-foreground">
        <Link to="/" className="underline hover:text-foreground">
          Terug naar home
        </Link>
      </p>
    </main>
  );
}

function ResultCard({
  match,
  existing,
  onSave,
  isSaving,
}: {
  match: { id: string; round: string; match_date: string; home_team: string; away_team: string };
  existing?: { home_score: number; away_score: number };
  onSave: (home: number, away: number) => void;
  isSaving: boolean;
}) {
  const [homeScore, setHomeScore] = useState<number | "">(
    existing ? existing.home_score : ""
  );
  const [awayScore, setAwayScore] = useState<number | "">(
    existing ? existing.away_score : ""
  );

  const matchDate = new Date(match.match_date);
  const formattedDate = matchDate.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="pixel-card overflow-hidden p-0">
      <div className="pattern-1988 px-5 py-2">
        <span className="pixel-heading text-[0.55rem] text-white [text-shadow:1px_1px_0_rgb(0_0_0/0.5)]">
          {match.round} · {formattedDate}
        </span>
      </div>
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between text-xl font-bold">
          <span className={match.home_team === "Nederland" ? "text-oranje" : "text-foreground"}>
            {match.home_team}
          </span>
          <span className="pixel-heading text-[0.5rem] text-muted-foreground">vs</span>
          <span className={match.away_team === "Nederland" ? "text-oranje" : "text-foreground"}>
            {match.away_team}
          </span>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Input
            type="number"
            min={0}
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value === "" ? "" : parseInt(e.target.value))}
            className="h-14 w-16 rounded-none border-2 border-oranje/60 text-center !text-3xl font-bold"
            placeholder="-"
          />
          <span className="pixel-heading text-sm text-muted-foreground">:</span>
          <Input
            type="number"
            min={0}
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value === "" ? "" : parseInt(e.target.value))}
            className="h-14 w-16 rounded-none border-2 border-oranje/60 text-center !text-3xl font-bold"
            placeholder="-"
          />
        </div>
        <Button
          className="pixel-btn mt-5 w-full bg-oranje text-primary-foreground hover:bg-oranje-dark"
          onClick={() => onSave(Number(homeScore), Number(awayScore))}
          disabled={isSaving || homeScore === "" || awayScore === ""}
        >
          <Save className="mr-2 h-4 w-4" />
          {existing ? "Uitslag wijzigen" : "Uitslag opslaan"}
        </Button>
      </div>
    </div>
  );
}
