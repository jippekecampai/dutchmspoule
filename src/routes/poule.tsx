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
    <div className="min-h-screen bg-[#07111f] text-foreground">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#0f213f_0%,#0b3b2d_58%,#f97316_130%)] px-5 py-9 text-center text-white shadow-2xl shadow-black/25">
          <div className="absolute inset-x-0 bottom-0 h-2 bg-[linear-gradient(90deg,#f97316_0_33%,#ffffff_33%_66%,#16a34a_66%_100%)]" />
          <div className="absolute -left-16 -top-16 h-36 w-36 rounded-full border-[18px] border-white/10" />
          <div className="absolute -right-12 top-10 h-28 w-28 rounded-full border-[14px] border-oranje/30" />
          <div className="relative mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-oranje shadow-lg shadow-oranje/30">
            <Trophy className="h-6 w-6" />
          </div>
          <h1 className="relative text-3xl font-extrabold text-white sm:text-5xl">DutchMSP WK Poule</h1>
          <p className="relative mx-auto mt-2 max-w-xl text-sm font-medium text-white/80 sm:text-base">
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
              <div key={i} className="h-48 animate-pulse rounded-3xl bg-white/15" />
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
    <Card className="mb-6 rounded-3xl border border-oranje/50 bg-[#fff7ed] p-5 shadow-2xl shadow-black/20">
      <div className="mx-auto flex max-w-2xl gap-3">
        <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-oranje-dark" />
        <div>
          <div className="font-semibold text-navy">Betaling nodig om mee te spelen</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Inleg {amount}. Scan de QR-code of open de betaallink. Zodra de organisator je betaling bevestigt, wordt je account geactiveerd en kun je voorspellen.
          </div>
        </div>
      </div>

      <div className="mx-auto mt-5 flex max-w-xl flex-col items-center justify-center gap-5 rounded-2xl border border-oranje/60 bg-black p-5 text-center shadow-xl shadow-navy/20">
        <div className="rounded-2xl bg-black p-3 shadow-sm ring-1 ring-white/15">
          <img src={bunqQrAsset.url} alt="bunq QR voor mspwkpoule" width={180} height={180} className="block h-44 w-44 object-contain" />
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-white">
            <QrCode className="h-4 w-4 text-oranje" /> Scan met je telefoon
          </div>
          <p className="mt-1 break-all text-xs text-oranje-light">{BUNQ_PAYMENT_URL}</p>
          <a href={BUNQ_PAYMENT_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block">
            <Button className="bg-oranje text-white hover:bg-oranje-dark">
              <ExternalLink className="mr-2 h-4 w-4" /> Open betaallink
            </Button>
          </a>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
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
    <Card className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-white p-0 shadow-2xl shadow-black/20">
      <div className="bg-[linear-gradient(90deg,#f97316,#0f213f_36%,#0b3b2d)] px-5 py-3 text-white">
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
  pendingApproval,
}: {
  match: any;
  prediction?: any;
  onSave: (home: number, away: number) => void;
  isSaving: boolean;
  disabled: boolean;
  pendingApproval: boolean;
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
    <Card className="overflow-hidden rounded-3xl border border-white/10 bg-white p-0 shadow-2xl shadow-black/20">
      <div className="bg-[linear-gradient(90deg,#f97316,#0f213f_36%,#0b3b2d)] px-5 py-3 text-white">
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
        <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className={`text-lg font-extrabold ${isNederlandHome ? "text-oranje" : "text-navy"}`}>
            {match.home_team}
          </div>
          <div className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold uppercase text-green-700 ring-1 ring-green-200">vs</div>
          <div className={`text-right text-lg font-extrabold ${!isNederlandHome ? "text-oranje" : "text-navy"}`}>
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
            Log in om je voorspelling in te vullen
          </p>
        ) : isLocked ? (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Gesloten sinds {formattedLockTime}
          </p>
        ) : (
          <>
            <Button
              className="mt-4 w-full bg-oranje text-white hover:bg-oranje-dark disabled:opacity-50"
              onClick={() => onSave(Number(homeScore), Number(awayScore))}
              disabled={isSaving || homeScore === "" || awayScore === "" || !hasChanges || isLocked}
            >
              {isSaving ? "Opslaan..." : prediction ? "Wijziging opslaan" : "Voorspelling opslaan"}
            </Button>
            {pendingApproval && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-oranje-dark">
                <AlertCircle className="h-3.5 w-3.5" />
                Telt pas mee zodra de organisator je betaling akkoord geeft
              </p>
            )}
          </>
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
