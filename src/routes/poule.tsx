import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getMatches, getPredictions, savePrediction, getMatchResults, getParticipationStatus } from "@/lib/pool.functions";
import { Trophy, Clock, MapPin, AlertCircle, Check, X, CircleDashed, CreditCard, ShieldCheck, Lock, QrCode, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import bunqQrAsset from "@/assets/bunq-qr.png.asset.json";

const BUNQ_PAYMENT_URL = "https://bunq.me/mspwkpoule";

export const Route = createFileRoute("/poule")({
  component: PoulePage,
});

function PoulePage() {
  const [user, setUser] = useState<null | { id: string }>(null);
  const queryClient = useQueryClient();

  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id });
    });
  });

  const fetchMatches = useServerFn(getMatches);
  const fetchPredictions = useServerFn(getPredictions);
  const fetchResults = useServerFn(getMatchResults);
  const fetchParticipation = useServerFn(getParticipationStatus);
  
  const savePred = useServerFn(savePrediction);

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: fetchMatches,
  });

  const { data: predictions } = useQuery({
    queryKey: ["predictions"],
    queryFn: fetchPredictions,
    enabled: !!user,
  });

  const { data: participation } = useQuery({
    queryKey: ["participation-status"],
    queryFn: fetchParticipation,
    enabled: !!user,
    retry: false,
  });

  const { data: results } = useQuery({
    queryKey: ["match-results"],
    queryFn: fetchResults,
  });

  const saveMutation = useMutation({
    mutationFn: savePred,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success("Voorspelling opgeslagen!");
    },
    onError: (err: Error) => toast.error(err.message),
  });


  const getUserPrediction = (matchId: string) => {
    return (predictions || []).find((p) => p.match_id === matchId);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Je Voorspellingen</h1>
          <p className="mt-1 text-muted-foreground">
            Vul je standen in. Aanpassen kan tot 10 minuten voor aanvang.
          </p>
        </div>

        {!user && (
          <Card className="mb-8 p-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-oranje" />
            <h3 className="mb-2 font-semibold text-foreground">Log in om mee te doen</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Maak een account aan of log in om je voorspellingen door te geven.
            </p>
            <Link to="/auth">
              <Button className="bg-oranje text-white hover:bg-oranje-dark">
                Inloggen / Registreren
              </Button>
            </Link>
          </Card>
        )}

        {user && (
          <>
            <ParticipationCard participation={participation} />

            <MyStandCard
              matches={matches || []}
              predictions={predictions || []}
              results={results || []}
            />
          </>
        )}

        {matchesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {(matches || []).map((match) => (
              <MatchPredictionCard
                key={match.id}
                match={match}
                prediction={getUserPrediction(match.id)}
                onSave={(home, away) =>
                  saveMutation.mutate({
                    data: { match_id: match.id, home_score: home, away_score: away },
                  })
                }
                isSaving={saveMutation.isPending}
                disabled={!user}
                pendingApproval={!!user && participation?.isPaid !== true}

              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ParticipationCard({
  participation,
}: {
  participation?: {
    isPaid: boolean;
    status: string;
    amountCents: number;
    currency: string;
    paidAt: string | null;
  };
}) {
  const amount = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: participation?.currency || "EUR",
  }).format((participation?.amountCents || 1000) / 100);

  if (participation?.isPaid) {
    return (
      <Card className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-700" />
          <div>
            <div className="font-semibold">Deelname bevestigd</div>
            <div className="text-sm text-emerald-800">
              Je betaling is verwerkt. Je kunt voorspellingen invullen tot 10 minuten voor de wedstrijd.
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-6 rounded-2xl border border-oranje/30 bg-oranje/10 p-5">
      <div className="flex gap-3">
        <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-oranje-dark" />
        <div>
          <div className="font-semibold text-foreground">Betaling nodig om mee te spelen</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Inleg {amount}. Scan de QR-code of open de betaallink. Zodra de organisator je betaling bevestigt, wordt je account geactiveerd en kun je voorspellen.
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-4 rounded-xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-lg bg-white p-2 shadow-sm">
          <img src={bunqQrAsset.url} alt="bunq QR voor mspwkpoule" width={180} height={180} className="block h-44 w-44 object-contain" />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground sm:justify-start">
            <QrCode className="h-4 w-4 text-oranje-dark" /> Scan met je telefoon
          </div>
          <p className="mt-1 text-xs text-muted-foreground break-all">{BUNQ_PAYMENT_URL}</p>
          <a href={BUNQ_PAYMENT_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block">
            <Button className="bg-oranje text-white hover:bg-oranje-dark">
              <ExternalLink className="mr-2 h-4 w-4" /> Open betaallink
            </Button>
          </a>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Na betaling controleert de organisator je inleg en activeert je account handmatig.
      </p>
    </Card>
  );
}

function MyStandCard({ matches, predictions, results }: { matches: any[]; predictions: any[]; results: any[] }) {
  const filled = predictions.length;
  const total = matches.length;

  let points = 0;
  let decided = 0;
  for (const pred of predictions) {
    const result = results.find((r) => r.match_id === pred.match_id);
    if (!result) continue;
    decided++;
    const pHome = pred.home_score > pred.away_score;
    const pAway = pred.home_score < pred.away_score;
    const pDraw = pred.home_score === pred.away_score;
    const rHome = result.home_score > result.away_score;
    const rAway = result.home_score < result.away_score;
    const rDraw = result.home_score === result.away_score;
    if ((pHome && rHome) || (pAway && rAway) || (pDraw && rDraw)) points++;
  }

  return (
    <Card className="mb-8 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-sm">
      <div className="bg-navy px-5 py-3 text-white">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
          <Trophy className="h-4 w-4 text-oranje" /> Mijn stand
        </h2>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border">
        <div className="p-4 text-center">
          <div className="text-2xl font-extrabold text-foreground">{filled}/{total}</div>
          <div className="text-xs text-muted-foreground">Voorspeld</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-2xl font-extrabold text-oranje">{points}</div>
          <div className="text-xs text-muted-foreground">Punten</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-2xl font-extrabold text-foreground">{decided}</div>
          <div className="text-xs text-muted-foreground">Gespeeld</div>
        </div>
      </div>
      {matches.length > 0 && (
        <ul className="divide-y divide-border border-t border-border">
          {matches.map((m) => {
            const pred = predictions.find((p) => p.match_id === m.id);
            const result = results.find((r) => r.match_id === m.id);
            let status: "correct" | "wrong" | "pending" | "empty" = "empty";
            if (pred && result) {
              const pHome = pred.home_score > pred.away_score;
              const pAway = pred.home_score < pred.away_score;
              const pDraw = pred.home_score === pred.away_score;
              const rHome = result.home_score > result.away_score;
              const rAway = result.home_score < result.away_score;
              const rDraw = result.home_score === result.away_score;
              status = (pHome && rHome) || (pAway && rAway) || (pDraw && rDraw) ? "correct" : "wrong";
            } else if (pred) status = "pending";
            return (
              <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="truncate text-foreground">{m.home_team} – {m.away_team}</span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-foreground">
                    {pred ? `${pred.home_score}-${pred.away_score}` : "—"}
                  </span>
                  {result && (
                    <span className="font-mono text-xs text-muted-foreground">
                      (uitslag {result.home_score}-{result.away_score})
                    </span>
                  )}
                  {status === "correct" && <Check className="h-4 w-4 text-green-600" />}
                  {status === "wrong" && <X className="h-4 w-4 text-destructive" />}
                  {status === "pending" && <CircleDashed className="h-4 w-4 text-muted-foreground" />}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function MatchPredictionCard({
  match,
  prediction,
  onSave,
  isSaving,
  disabled,
  paymentRequired,
}: {
  match: any;
  prediction?: any;
  onSave: (home: number, away: number) => void;
  isSaving: boolean;
  disabled: boolean;
  paymentRequired: boolean;
}) {
  const [homeScore, setHomeScore] = useState<number | "">(
    prediction ? prediction.home_score : ""
  );
  const [awayScore, setAwayScore] = useState<number | "">(
    prediction ? prediction.away_score : ""
  );
  const hasChanges =
    prediction === undefined ||
    homeScore !== prediction.home_score ||
    awayScore !== prediction.away_score;

  useEffect(() => {
    setHomeScore(prediction ? prediction.home_score : "");
    setAwayScore(prediction ? prediction.away_score : "");
  }, [prediction?.home_score, prediction?.away_score]);

  const matchDate = new Date(match.match_date);
  const lockDate = new Date(matchDate.getTime() - 10 * 60 * 1000);
  const isLocked = lockDate.getTime() <= Date.now();
  const formattedDate = matchDate.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const formattedTime = matchDate.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedLockTime = lockDate.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isNederlandHome = match.home_team === "Nederland";

  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-sm">
      <div className="bg-navy px-5 py-3 text-white">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
            {match.round}
          </span>
          <div className="flex items-center gap-3 text-xs opacity-80">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formattedDate} · {formattedTime}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className={`text-lg font-bold ${isNederlandHome ? "text-oranje" : ""}`}>
            {match.home_team}
          </div>
          <div className="text-sm text-muted-foreground">vs</div>
          <div className={`text-lg font-bold ${!isNederlandHome ? "text-oranje" : ""}`}>
            {match.away_team}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Input
            type="number"
            min={0}
            max={20}
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value === "" ? "" : parseInt(e.target.value))}
            disabled={disabled || isLocked}
            className="h-14 w-16 text-center text-2xl font-bold"
            placeholder="-"
          />
          <span className="text-2xl font-light text-muted-foreground">:</span>
          <Input
            type="number"
            min={0}
            max={20}
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value === "" ? "" : parseInt(e.target.value))}
            disabled={disabled || isLocked}
            className="h-14 w-16 text-center text-2xl font-bold"
            placeholder="-"
          />
        </div>

        {disabled ? (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {paymentRequired ? "Betaal je deelname om voorspellingen in te vullen" : "Log in om je voorspelling in te vullen"}
          </p>
        ) : isLocked ? (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Gesloten sinds {formattedLockTime}
          </p>
        ) : (
          <Button
            className="mt-4 w-full bg-oranje text-white hover:bg-oranje-dark disabled:opacity-50"
            onClick={() => onSave(Number(homeScore), Number(awayScore))}
            disabled={isSaving || homeScore === "" || awayScore === "" || !hasChanges || isLocked}
          >
            {isSaving ? "Opslaan..." : prediction ? "Wijziging opslaan" : "Voorspelling opslaan"}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-1 border-t border-border px-5 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3" />
          {match.venue}
        </span>
        <span className="flex items-center gap-1.5">
          <Lock className="h-3 w-3" />
          Sluit {formattedLockTime}
        </span>
      </div>
    </Card>
  );
}
