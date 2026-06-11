import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Trophy, Shield, Calendar, Users, ChevronRight, CreditCard, Lock, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RetroGameIntro, type PredictedScore } from "@/components/RetroGameIntro";
import { PlayableGame } from "@/components/PlayableGame";
import { supabase } from "@/integrations/supabase/client";
import { getMatches, getPredictions, submitGameScore } from "@/lib/pool.functions";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { t } = useI18n();
  const [user, setUser] = useState<null | { id: string }>(null);
  const [playing, setPlaying] = useState(false);
  const queryClient = useQueryClient();

  const submitScore = useServerFn(submitGameScore);
  const scoreMutation = useMutation({
    mutationFn: submitScore,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["game_highscores"] });
      if (result.improved) {
        toast.success(t("Nieuwe highscore! Bekijk de ranglijst bij het klassement.", "New high score! Check the arcade rankings on the standings page."));
      } else {
        toast.info(
          t(`Geen record — je beste blijft ${result.best?.goals_for}-${result.best?.goals_against}.`, `No record — your best is still ${result.best?.goals_for}-${result.best?.goals_against}.`)
        );
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleMatchEnd = (goalsFor: number, goalsAgainst: number) => {
    if (!user) {
      toast.info(t("Log in om je score op de highscore-lijst te zetten!", "Log in to get your score on the high-score list!"));
      return;
    }
    scoreMutation.mutate({
      data: { goals_for: goalsFor, goals_against: goalsAgainst, opponent: nextOpponent.name },
    });
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id });
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id } : null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchMatches = useServerFn(getMatches);
  const fetchPredictions = useServerFn(getPredictions);

  const { data: matches } = useQuery({
    queryKey: ["matches"],
    queryFn: fetchMatches,
  });

  const { data: predictions } = useQuery({
    queryKey: ["predictions"],
    queryFn: fetchPredictions,
    enabled: !!user,
    retry: false,
  });

  // Per level (wedstrijdvolgorde) de eigen voorspelling; null = nog niet ingevuld.
  const predictedScores = useMemo<PredictedScore[] | undefined>(() => {
    if (!matches?.length || !predictions?.length) return undefined;
    return matches.slice(0, 3).map((match) => {
      const pred = predictions.find((p) => p.match_id === match.id);
      return pred ? { home: pred.home_score, away: pred.away_score } : null;
    });
  }, [matches, predictions]);

  // Eerstvolgende tegenstander van Nederland (op match_date).
  const nextOpponent = useMemo(() => {
    if (!matches?.length) return { name: "Tegenstander", code: "CPU" };
    const now = Date.now();
    const upcoming =
      matches.find(
        (m) =>
          new Date(m.match_date).getTime() > now &&
          (m.home_team === "Nederland" || m.away_team === "Nederland"),
      ) ||
      matches.find((m) => m.home_team === "Nederland" || m.away_team === "Nederland");
    if (!upcoming) return { name: "Tegenstander", code: "CPU" };
    const name = upcoming.home_team === "Nederland" ? upcoming.away_team : upcoming.home_team;
    return { name, code: name.slice(0, 3).toUpperCase() };
  }, [matches]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b-[3px] border-oranje bg-navy py-20 sm:py-28">
        <div className="pattern-1988 absolute inset-x-0 top-0 h-3" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <div className="pixel-heading mb-6 inline-flex items-center gap-2 border-2 border-oranje bg-navy/80 px-4 py-2 text-[0.6rem] text-oranje-light">
            <Trophy className="h-4 w-4" />
            {t("WK 2026 — Groep F", "World Cup 2026 — Group F")}
          </div>
          <h1 className="pixel-heading mb-6 text-2xl leading-relaxed text-foreground sm:text-4xl">
            DutchMSP
            <br />
            <span className="text-oranje">WK Poule</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-xl text-muted-foreground">
            {t("Voorspel de standen van Oranje op het WK, sprokkel punten bij elke wedstrijd en strijd mee om de pot. Wie kent het Nederlands elftal het best?", "Predict the scores of the Dutch team at the World Cup, collect points every match and compete for the pot. Who knows the Oranje best?")}
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/poule">
              <Button size="lg" className="pixel-btn bg-oranje text-primary-foreground hover:bg-oranje-dark">
                {t("Doe mee aan de poule", "Join the pool")}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button size="lg" className="pixel-btn bg-navy-light text-foreground hover:bg-secondary">
                {t("Bekijk het klassement", "View the standings")}
              </Button>
            </Link>
          </div>
        </div>
        <div className="flag-strip absolute inset-x-0 bottom-0" />
      </section>

      {/* 8-bit arcadespelletje */}
      <section className="mx-auto max-w-5xl px-4 pt-16 text-center">
        <h2 className="pixel-heading mb-3 text-sm text-foreground sm:text-base">
          {t("Tussendoortje: het 8-bit spelletje", "Side quest: the 8-bit game")}
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
          {t("Even wachten op de aftrap? Speel een potje retro-voetbal. Puur voor de lol — en voor de eeuwige roem op de arcade-ranglijst.", "Waiting for kick-off? Play a round of retro football. Purely for fun — and for eternal glory on the arcade leaderboard.")}
        </p>

        {playing ? (
          <PlayableGame
            onExit={() => setPlaying(false)}
            onMatchEnd={handleMatchEnd}
            opponentName={nextOpponent.name}
            opponentCode={nextOpponent.code}
          />
        ) : (
          <>
            <div className="mx-auto mb-4 max-w-2xl border-[6px] border-oranje bg-black p-1.5 shadow-[8px_8px_0_0_rgb(0_0_0/0.6)]">
              <RetroGameIntro className="block aspect-video w-full" predictions={predictedScores} />
            </div>
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="pixel-btn bg-oranje px-6 py-3 text-primary-foreground shadow-[4px_4px_0_0_rgb(0_0_0/0.6)] hover:bg-oranje-dark"
              >
                ▶ {t("SPEEL HET SPELLETJE", "PLAY THE GAME")}
              </button>
              <p className="pixel-heading blink text-[0.55rem] text-oranje-light">
                {predictedScores ? t("Met jouw voorspellingen — PRESS START", "With your predictions — PRESS START") : "PRESS START TO PLAY"}
              </p>
              <p className="max-w-md text-xs text-muted-foreground">
                {t("Een mini-wedstrijd van 2× 1 minuut. Op mobiel: joystick links, SHOOT rechts. Op desktop: pijltjes/WASD en spatie. Ingelogd? Dan telt je beste uitslag mee op de", "A mini-match of 2× 1 minute. On mobile: joystick left, SHOOT right. On desktop: arrows/WASD and space. Logged in? Your best result counts on the")}{" "}
                <Link to="/leaderboard" className="underline hover:text-foreground">
                  {t("highscore-lijst", "high-score list")}
                </Link>
                .
              </p>
            </div>
          </>
        )}
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 pt-12">
        <div className="grid gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={<CreditCard className="h-5 w-5 text-oranje" />}
            title={t("Eén keer inleggen", "Pay once")}
            description={t("Leg eenmalig in en speel het hele toernooi mee om de prijzenpot.", "Pay the entry fee once and play the whole tournament for the prize pot.")}
          />
          <FeatureCard
            icon={<Lock className="h-5 w-5 text-oranje" />}
            title={t("Eerlijk spel", "Fair play")}
            description={t("Je voorspelling staat vast vanaf 10 minuten voor de aftrap — niemand kan nog gluren.", "Your prediction locks 10 minutes before kick-off — no peeking after that.")}
          />
          <FeatureCard
            icon={<ListChecks className="h-5 w-5 text-oranje" />}
            title={t("Altijd zicht op de stand", "Always see where you stand")}
            description={t("Na elke wedstrijd zie je meteen hoe je ervoor staat tegenover de rest.", "After every match you instantly see how you compare to the rest.")}
          />
        </div>
      </section>

      {/* Matches */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="pixel-heading mb-10 text-center text-sm text-foreground sm:text-base">
          <span className="text-oranje">★</span> {t("Nederlandse Groepswedstrijden", "Dutch Group Matches")} <span className="text-oranje">★</span>
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <MatchCard
            round={t("Groepsfase • 1", "Group stage • 1")}
            date={t("Zondag 14 juni", "Sunday June 14")}
            time="22:00"
            home={t("Nederland", "Netherlands")}
            away={t("Japan", "Japan")}
            venue="AT&T Stadium, Dallas"
          />
          <MatchCard
            round={t("Groepsfase • 2", "Group stage • 2")}
            date={t("Zaterdag 20 juni", "Saturday June 20")}
            time="19:00"
            home={t("Nederland", "Netherlands")}
            away={t("Zweden", "Sweden")}
            venue="NRG Stadium, Houston"
          />
          <MatchCard
            round={t("Groepsfase • 3", "Group stage • 3")}
            date={t("Vrijdag 26 juni", "Friday June 26")}
            time="01:00"
            home={t("Tunesië", "Tunisia")}
            away={t("Nederland", "Netherlands")}
            venue="Arrowhead Stadium, Kansas City"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="border-y-[3px] border-oranje/40 bg-navy py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="pixel-heading mb-10 text-center text-sm text-foreground sm:text-base">
            {t("Hoe werkt het?", "How does it work?")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <StepCard
              icon={<Shield className="h-6 w-6 text-oranje" />}
              title={t("1. Doe mee", "1. Join")}
              description={t("Maak je account, leg in en je speelt het hele WK mee.", "Create your account, pay the entry fee and you play the whole World Cup.")}
            />
            <StepCard
              icon={<Calendar className="h-6 w-6 text-oranje" />}
              title={t("2. Voorspel de standen", "2. Predict the scores")}
              description={t("Tik per wedstrijd je uitslag in — aanpassen kan tot vlak voor de aftrap.", "Enter your score for each match — you can change it until just before kick-off.")}
            />
            <StepCard
              icon={<Trophy className="h-6 w-6 text-oranje" />}
              title={t("3. Klim in de ranglijst", "3. Climb the rankings")}
              description={t("Punten tikken binnen na elke wedstrijd. Hou de top — en de pot — in de gaten.", "Points roll in after every match. Keep an eye on the top — and the pot.")}
            />
          </div>
          <p className="mt-8 text-center text-muted-foreground">
            {t("Nooit eerder meegedaan aan een poule?", "Never joined a prediction pool before?")}{" "}
            <Link to="/uitleg" className="text-oranje underline hover:text-oranje-light">
              {t("Lees de uitgebreide uitleg", "Read the full guide")}
            </Link>
            .
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t-[3px] border-oranje/40 bg-navy py-16">
        <div className="mx-auto max-w-5xl px-4 text-center">
        <h2 className="pixel-heading mb-5 text-sm text-foreground sm:text-base">
          {t("Klaar om mee te doen?", "Ready to join?")}
        </h2>
        <p className="mb-8 text-lg text-muted-foreground">
          {t("Pak je plek in de poule en laat zien dat jij Oranje het best aanvoelt.", "Grab your spot in the pool and show you know the Oranje best.")}
        </p>
        <Link to="/poule">
          <Button size="lg" className="pixel-btn bg-oranje text-primary-foreground hover:bg-oranje-dark">
            {t("Start je voorspellingen", "Start predicting")}
          </Button>
        </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="pixel-card p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center border-2 border-oranje bg-oranje/10">
        {icon}
      </div>
      <h3 className="pixel-heading mb-2 text-[0.65rem] text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function MatchCard({ round, date, time, home, away, venue }: {
  round: string;
  date: string;
  time: string;
  home: string;
  away: string;
  venue: string;
}) {
  return (
    <div className="pixel-card overflow-hidden p-0">
      <div className="pattern-1988 px-4 py-2">
        <span className="pixel-heading text-[0.55rem] text-white [text-shadow:1px_1px_0_rgb(0_0_0/0.5)]">
          {round}
        </span>
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between text-muted-foreground">
          <span>{date}</span>
          <span className="border border-oranje/50 bg-oranje/10 px-2 py-0.5 font-medium text-oranje-light">
            {time}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-lg font-bold">
          <span className={home === "Nederland" ? "text-oranje" : "text-foreground"}>{home}</span>
          <span className="pixel-heading text-[0.55rem] text-muted-foreground">vs</span>
          <span className={away === "Nederland" ? "text-oranje" : "text-foreground"}>{away}</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {venue}
        </div>
      </div>
    </div>
  );
}

function StepCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="pixel-card p-6 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border-2 border-oranje bg-oranje/10">
        {icon}
      </div>
      <h3 className="pixel-heading mb-3 text-[0.6rem] leading-relaxed text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
