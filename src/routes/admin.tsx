import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getMatches, getMatchResults, saveMatchResult, checkIsAdmin, getParticipantPayments, markParticipantPayment } from "@/lib/pool.functions";
import { Save, Lock, CreditCard, CheckCircle2, XCircle } from "lucide-react";
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
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Admin — Uitslagen</h1>
          <p className="mt-1 text-muted-foreground">
            Voer hier de uitslagen in na elke wedstrijd.
          </p>
        </div>

        {adminLoading ? (
          <Card className="p-8 text-center text-muted-foreground">Controleren...</Card>
        ) : !adminCheck?.isAdmin ? (
          <Card className="p-8 text-center">
            <Lock className="mx-auto mb-3 h-10 w-10 text-oranje" />
            <h2 className="mb-2 text-lg font-bold">Geen toegang</h2>
            <p className="text-sm text-muted-foreground">
              Alleen admins kunnen uitslagen invoeren. Vraag de organisator om je admin-rechten te geven.
            </p>
          </Card>
        ) : (
          <>
            <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-oranje" />
                <span>Je bent ingelogd als admin.</span>
              </div>
            </div>

            <Card className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-oranje" />
                <h2 className="text-lg font-bold text-foreground">Deelnamebetalingen</h2>
              </div>
              {(participants || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nog geen geregistreerde deelnemers.</p>
              ) : (
                <div className="space-y-3">
                  {(participants || []).map((participant) => {
                    const isPaid = participant.status === "paid";
                    return (
                      <div key={participant.user_id} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-semibold text-foreground">{participant.display_name}</div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {isPaid ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                            {isPaid ? "Betaald" : "Nog niet betaald"}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-oranje text-white hover:bg-oranje-dark"
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
                            variant="outline"
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
            </Card>

        <div className="space-y-4">
          {(matches || []).map((match) => {
            const existing = resultsMap.get(match.id);
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
              <Card key={match.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {match.round} · {formattedDate}
                </div>
                <div className="mb-4 flex items-center justify-between text-lg font-bold">
                  <span className={match.home_team === "Nederland" ? "text-oranje" : ""}>
                    {match.home_team}
                  </span>
                  <span className="text-muted-foreground text-base font-normal">vs</span>
                  <span className={match.away_team === "Nederland" ? "text-oranje" : ""}>
                    {match.away_team}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Input
                    type="number"
                    min={0}
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value === "" ? "" : parseInt(e.target.value))}
                    className="h-14 w-16 text-center text-2xl font-bold"
                    placeholder="-"
                  />
                  <span className="text-2xl font-light text-muted-foreground">:</span>
                  <Input
                    type="number"
                    min={0}
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value === "" ? "" : parseInt(e.target.value))}
                    className="h-14 w-16 text-center text-2xl font-bold"
                    placeholder="-"
                  />
                </div>
                <Button
                  className="mt-4 w-full bg-oranje text-white hover:bg-oranje-dark"
                  onClick={() =>
                    saveMutation.mutate({
                      data: {
                        match_id: match.id,
                        home_score: Number(homeScore),
                        away_score: Number(awayScore),
                      },
                    })
                  }
                  disabled={saveMutation.isPending || homeScore === "" || awayScore === ""}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {existing ? "Uitslag wijzigen" : "Uitslag opslaan"}
                </Button>
              </Card>
            );
          })}
        </div>
          </>
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link to="/" className="underline hover:text-foreground">
            Terug naar home
          </Link>
        </p>
      </main>
    </div>
  );
}
