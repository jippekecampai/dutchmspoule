import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="pixel-card relative mb-8 overflow-hidden p-0 text-center">
        <div className="pattern-1988 px-5 py-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border-[3px] border-white bg-navy shadow-[4px_4px_0_0_rgb(0_0_0/0.5)]">
            <Trophy className="h-6 w-6 text-oranje" />
          </div>
          <h1 className="pixel-heading text-lg text-white [text-shadow:2px_2px_0_rgb(0_0_0/0.6)] sm:text-2xl">
            DutchMSP WK Poule
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg font-medium text-white [text-shadow:1px_1px_0_rgb(0_0_0/0.6)]">
            Vul je standen in. Aanpassen kan tot 10 minuten voor aanvang.
          </p>
        </div>
        <div className="flag-strip" />
      </div>

      <ParticipationCard participation={user ? participation : undefined} />

      {!user && (
        <div className="pixel-card mb-8 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-oranje" />
          <h3 className="pixel-heading mb-3 text-[0.7rem] text-foreground">Log in om mee te doen</h3>
          <p className="mb-4 text-muted-foreground">
            Maak een account aan of log in om je voorspellingen door te geven.
          </p>
          <Link to="/auth">
            <Button className="pixel-btn bg-oranje text-primary-foreground hover:bg-oranje-dark">
              Inloggen / Registreren
            </Button>
          </Link>
        </div>
      )}

      {user && (
        <MyStandCard
          matches={matches || []}
          predictions={predictions || []}
          results={results || []}
        />
      )}

      {matchesLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse border-[3px] border-oranje/30 bg-card" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
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
      <div className="pixel-card-flat mb-6 border-emerald-500 bg-emerald-950/60 p-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <div>
            <div className="pixel-heading text-[0.6rem] text-emerald-300">Deelname bevestigd</div>
            <div className="mt-1 text-emerald-100">
              Je betaling is verwerkt. Je kunt voorspellingen invullen tot 10 minuten voor de wedstrijd.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pixel-card mb-6 p-5">
      <div className="mx-auto flex max-w-2xl gap-3">
        <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-oranje" />
        <div>
          <div className="pixel-heading text-[0.65rem] text-oranje">Betaling nodig om mee te spelen</div>
          <div className="mt-2 text-muted-foreground">
            Inleg {amount}. Scan de QR-code of open de betaallink. Zodra de organisator je betaling bevestigt, wordt je account geactiveerd en kun je voorspellen.
          </div>
        </div>
      </div>

      <div className="mx-auto mt-5 flex max-w-xl flex-col items-center justify-center gap-5 border-[3px] border-oranje bg-black p-5 text-center">
        <div className="border-2 border-white/20 bg-black p-3">
          <img src={bunqQrAsset.url} alt="bunq QR voor mspwkpoule" width={180} height={180} className="block h-44 w-44 object-contain" />
        </div>

        <div className="flex flex-col items-center">
          <div className="pixel-heading flex items-center justify-center gap-2 text-[0.6rem] text-white">
            <QrCode className="h-4 w-4 text-oranje" /> Scan met je telefoon
          </div>
          <p className="mt-2 break-all text-sm text-oranje-light">{BUNQ_PAYMENT_URL}</p>
          <a href={BUNQ_PAYMENT_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
            <Button className="pixel-btn bg-oranje text-primary-foreground hover:bg-oranje-dark">
              <ExternalLink className="mr-2 h-4 w-4" /> Open betaallink
            </Button>
          </a>
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Na betaling controleert de organisator je inleg en activeert je account handmatig.
      </p>
    </div>
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
    <div className="pixel-card mb-8 overflow-hidden p-0">
      <div className="pattern-1988 px-5 py-3">
        <h2 className="pixel-heading flex items-center gap-2 text-[0.65rem] text-white [text-shadow:1px_1px_0_rgb(0_0_0/0.5)]">
          <Trophy className="h-4 w-4" /> Mijn stand
        </h2>
      </div>
      <div className="grid grid-cols-3 divide-x-2 divide-oranje/30">
        <div className="p-4 text-center">
          <div className="pixel-heading text-base text-foreground">{filled}/{total}</div>
          <div className="text-sm text-muted-foreground">Voorspeld</div>
        </div>
        <div className="p-4 text-center">
          <div className="pixel-heading text-base text-oranje">{points}</div>
          <div className="text-sm text-muted-foreground">Punten</div>
        </div>
        <div className="p-4 text-center">
          <div className="pixel-heading text-base text-foreground">{decided}</div>
          <div className="text-sm text-muted-foreground">Gespeeld</div>
        </div>
      </div>
      {matches.length > 0 && (
        <ul className="divide-y divide-oranje/20 border-t-2 border-oranje/30">
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
              <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="truncate text-foreground">{m.home_team} – {m.away_team}</span>
                <span className="flex items-center gap-3">
                  <span className="font-retro text-foreground">
                    {pred ? `${pred.home_score}-${pred.away_score}` : "—"}
                  </span>
                  {result && (
                    <span className="text-sm text-muted-foreground">
                      (uitslag {result.home_score}-{result.away_score})
                    </span>
                  )}
                  {status === "correct" && <Check className="h-4 w-4 text-green-500" />}
                  {status === "wrong" && <X className="h-4 w-4 text-destructive" />}
                  {status === "pending" && <CircleDashed className="h-4 w-4 text-muted-foreground" />}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
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
    <div className="pixel-card overflow-hidden p-0">
      <div className="pattern-1988 px-5 py-3 text-white">
        <div className="flex items-center justify-between [text-shadow:1px_1px_0_rgb(0_0_0/0.5)]">
          <span className="pixel-heading text-[0.55rem]">
            {match.round}
          </span>
          <span className="flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3" />
            {formattedDate} · {formattedTime}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className={`text-xl font-bold ${isNederlandHome ? "text-oranje" : "text-foreground"}`}>
            {match.home_team}
          </div>
          <div className="pixel-heading border-2 border-oranje/50 bg-oranje/10 px-3 py-1 text-[0.5rem] text-oranje-light">vs</div>
          <div className={`text-right text-xl font-bold ${!isNederlandHome ? "text-oranje" : "text-foreground"}`}>
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
            className="h-14 w-16 rounded-none border-2 border-oranje/60 text-center !text-3xl font-bold"
            placeholder="-"
          />
          <span className="pixel-heading text-sm text-muted-foreground">:</span>
          <Input
            type="number"
            min={0}
            max={20}
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value === "" ? "" : parseInt(e.target.value))}
            disabled={disabled || isLocked}
            className="h-14 w-16 rounded-none border-2 border-oranje/60 text-center !text-3xl font-bold"
            placeholder="-"
          />
        </div>

        {disabled ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Log in om je voorspelling in te vullen
          </p>
        ) : isLocked ? (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Gesloten sinds {formattedLockTime}
          </p>
        ) : (
          <>
            <Button
              className="pixel-btn mt-5 w-full bg-oranje text-primary-foreground hover:bg-oranje-dark disabled:opacity-50"
              onClick={() => onSave(Number(homeScore), Number(awayScore))}
              disabled={isSaving || homeScore === "" || awayScore === "" || !hasChanges || isLocked}
            >
              {isSaving ? "Opslaan..." : prediction ? "Wijziging opslaan" : "Voorspelling opslaan"}
            </Button>
            {pendingApproval && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm text-oranje-light">
                <AlertCircle className="h-3.5 w-3.5" />
                Telt pas mee zodra de organisator je betaling akkoord geeft
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-1 border-t-2 border-oranje/30 px-5 py-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3" />
          {match.venue}
        </span>
        <span className="flex items-center gap-1.5">
          <Lock className="h-3 w-3" />
          Sluit {formattedLockTime}
        </span>
      </div>
    </div>
  );
}
