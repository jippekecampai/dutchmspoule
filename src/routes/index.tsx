import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Trophy, Shield, Calendar, Users, ChevronRight, Gamepad2, CreditCard, Lock, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RetroGameIntro, type PredictedScore } from "@/components/RetroGameIntro";
import { supabase } from "@/integrations/supabase/client";
import { getMatches, getPredictions } from "@/lib/pool.functions";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [user, setUser] = useState<null | { id: string }>(null);

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
    enabled: !!user,
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

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b-[3px] border-oranje bg-navy py-20 sm:py-28">
        <div className="pattern-1988 absolute inset-x-0 top-0 h-3" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <div className="pixel-heading mb-6 inline-flex items-center gap-2 border-2 border-oranje bg-navy/80 px-4 py-2 text-[0.6rem] text-oranje-light">
            <Gamepad2 className="h-4 w-4" />
            WK 2026 — Groep F
          </div>
          <h1 className="pixel-heading mb-6 text-2xl leading-relaxed text-foreground sm:text-4xl">
            DutchMSP
            <br />
            <span className="text-oranje">WK Poule</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-xl text-muted-foreground">
            Log in, betaal je deelname en voorspel de standen. Wijzigingen sluiten automatisch 10 minuten voor aftrap.
          </p>

          {/* Arcade-scherm: 8-bit demo door de drie groepswedstrijden */}
          <div className="mx-auto mb-4 max-w-2xl border-[6px] border-oranje bg-black p-1.5 shadow-[8px_8px_0_0_rgb(0_0_0/0.6)]">
            <RetroGameIntro className="block aspect-video w-full" predictions={predictedScores} />
          </div>
          <p className="pixel-heading blink mb-8 text-[0.6rem] text-oranje-light">
            {predictedScores ? "Met jouw voorspellingen" : "Press start to play"}
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/poule">
              <Button size="lg" className="pixel-btn bg-oranje text-primary-foreground hover:bg-oranje-dark">
                Doe mee aan de poule
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button size="lg" className="pixel-btn bg-navy-light text-foreground hover:bg-secondary">
                Bekijk het klassement
              </Button>
            </Link>
          </div>
        </div>
        <div className="flag-strip absolute inset-x-0 bottom-0" />
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 pt-12">
        <div className="grid gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={<CreditCard className="h-5 w-5 text-oranje" />}
            title="Betaalde deelname"
            description="Alleen bevestigde deelnemers kunnen voorspellingen opslaan."
          />
          <FeatureCard
            icon={<Lock className="h-5 w-5 text-oranje" />}
            title="Deadline per wedstrijd"
            description="Inzendingen worden 10 minuten voor aanvang vergrendeld."
          />
          <FeatureCard
            icon={<ListChecks className="h-5 w-5 text-oranje" />}
            title="Controleerbare ranglijst"
            description="Punten en uitslagen blijven centraal zichtbaar na gespeelde wedstrijden."
          />
        </div>
      </section>

      {/* Matches */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="pixel-heading mb-10 text-center text-sm text-foreground sm:text-base">
          <span className="text-oranje">★</span> Nederlandse Groepswedstrijden <span className="text-oranje">★</span>
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <MatchCard
            round="Groepsfase • 1"
            date="Zondag 14 juni"
            time="22:00"
            home="Nederland"
            away="Japan"
            venue="AT&T Stadium, Dallas"
          />
          <MatchCard
            round="Groepsfase • 2"
            date="Zaterdag 20 juni"
            time="19:00"
            home="Nederland"
            away="Zweden"
            venue="NRG Stadium, Houston"
          />
          <MatchCard
            round="Groepsfase • 3"
            date="Vrijdag 26 juni"
            time="01:00"
            home="Tunesië"
            away="Nederland"
            venue="Arrowhead Stadium, Kansas City"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="border-y-[3px] border-oranje/40 bg-navy py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="pixel-heading mb-10 text-center text-sm text-foreground sm:text-base">
            Hoe werkt het?
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <StepCard
              icon={<Shield className="h-6 w-6 text-oranje" />}
              title="1. Login en betaal"
              description="Maak een account aan. Je deelname wordt actief na bevestigde betaling."
            />
            <StepCard
              icon={<Calendar className="h-6 w-6 text-oranje" />}
              title="2. Vul standen in"
              description="Voorspel per wedstrijd de exacte stand en pas aan tot 10 minuten voor aftrap."
            />
            <StepCard
              icon={<Trophy className="h-6 w-6 text-oranje" />}
              title="3. Volg de ranglijst"
              description="Na uitslagen wordt het klassement bijgewerkt en blijven voorspellingen controleerbaar."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h2 className="pixel-heading mb-5 text-sm text-foreground sm:text-base">
          Klaar om mee te doen?
        </h2>
        <p className="mb-8 text-lg text-muted-foreground">
          Log in, regel je deelname en vul je voorspellingen op tijd in.
        </p>
        <Link to="/poule">
          <Button size="lg" className="pixel-btn bg-oranje text-primary-foreground hover:bg-oranje-dark">
            Start je voorspellingen
          </Button>
        </Link>
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
