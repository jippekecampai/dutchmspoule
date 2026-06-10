import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Shield, Calendar, Users, ChevronRight, Gamepad2, CreditCard, Lock, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import introVideo from "@/assets/intro-video.mp4.asset.json";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy py-20 text-primary-foreground sm:py-28">
        <video
          src={introVideo.url}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-navy/60" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-oranje/20 px-4 py-1.5 text-sm font-medium text-oranje-light backdrop-blur">
            <Gamepad2 className="h-4 w-4" />
            WK 2026 — Groep F
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-6xl">
            DutchMSP WK Poule
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
            Log in, betaal je deelname en voorspel de standen. Wijzigingen sluiten automatisch 10 minuten voor aftrap.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/poule">
              <Button size="lg" className="bg-oranje text-white hover:bg-oranje-dark">
                Doe mee aan de poule
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
                Bekijk het klassement
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 pt-12">
        <div className="grid gap-4 sm:grid-cols-3">
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
        <h2 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl">
          Nederlandse Groepswedstrijden
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
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
      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground sm:text-3xl">
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
        <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
          Klaar om mee te doen?
        </h2>
        <p className="mb-6 text-muted-foreground">
          Log in, regel je deelname en vul je voorspellingen op tijd in.
        </p>
        <Link to="/poule">
          <Button size="lg" className="bg-oranje text-white hover:bg-oranje-dark">
            Start je voorspellingen
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        DutchMSP WK 2026 Poule
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-oranje/10">
        {icon}
      </div>
      <h3 className="mb-1 font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
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
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {round}
      </div>
      <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>{date}</span>
        <span className="rounded-full bg-oranje/10 px-2.5 py-0.5 font-medium text-oranje-dark">
          {time}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 text-lg font-bold">
        <span className={home === "Nederland" ? "text-oranje" : ""}>{home}</span>
        <span className="text-base font-normal text-muted-foreground">vs</span>
        <span className={away === "Nederland" ? "text-oranje" : ""}>{away}</span>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        {venue}
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
    <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-oranje/10">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
