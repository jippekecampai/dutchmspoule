import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  UserPlus,
  CreditCard,
  ListChecks,
  Clock,
  Trophy,
  Target,
  PiggyBank,
  Crown,
  Medal,
} from "lucide-react";

export const Route = createFileRoute("/uitleg")({
  component: UitlegPage,
});

function UitlegPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Kop */}
      <div className="pixel-card mb-8 overflow-hidden p-0 text-center">
        <div className="pattern-1988 px-5 py-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border-[3px] border-white bg-navy shadow-[4px_4px_0_0_rgb(0_0_0/0.5)]">
            <HelpCircle className="h-6 w-6 text-oranje" />
          </div>
          <h1 className="pixel-heading text-lg text-white [text-shadow:2px_2px_0_rgb(0_0_0/0.6)] sm:text-2xl">
            Hoe werkt het?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg font-medium text-white [text-shadow:1px_1px_0_rgb(0_0_0/0.6)]">
            De complete uitleg — ook als je nog nooit hebt meegedaan aan een poule.
          </p>
        </div>
        <div className="flag-strip" />
      </div>

      {/* Wat is een poule? */}
      <section className="pixel-card mb-6 p-6">
        <h2 className="pixel-heading mb-4 flex items-center gap-2 text-[0.8rem] text-oranje">
          <Target className="h-5 w-5" /> Wat is een voetbalpoule?
        </h2>
        <div className="space-y-3 text-muted-foreground">
          <p>
            Een voetbalpoule is een spelletje tussen vrienden, familie of collega's. Je probeert te{" "}
            <span className="text-foreground">voorspellen hoe de wedstrijden van Nederland aflopen</span>.
            Voor elke wedstrijd vul je van tevoren in wat volgens jou de eindstand wordt, bijvoorbeeld
            "Nederland 2 – Japan 1".
          </p>
          <p>
            Zit je voorspelling goed? Dan verdien je punten. Iedereen die meedoet, voorspelt dezelfde
            wedstrijden, en aan het eind van het toernooi heeft{" "}
            <span className="text-foreground">degene met de meeste punten gewonnen</span>.
          </p>
          <p className="border-l-4 border-oranje/50 pl-4 text-sm">
            Het is dus geen gokken bij een wedkantoor — het is gewoon onder elkaar wie het beste het
            Nederlands elftal kan inschatten. Een beetje geluk en een beetje verstand van voetbal. 🍊
          </p>
        </div>
      </section>

      {/* Stap voor stap */}
      <section className="pixel-card mb-6 p-6">
        <h2 className="pixel-heading mb-5 flex items-center gap-2 text-[0.8rem] text-oranje">
          <ListChecks className="h-5 w-5" /> Stap voor stap
        </h2>
        <ol className="space-y-5">
          <Step
            icon={<UserPlus className="h-5 w-5 text-oranje" />}
            n={1}
            title="Maak een account"
            text="Log in met Google, Apple of je e-mailadres. Daarmee bewaren we jouw voorspellingen."
          />
          <Step
            icon={<CreditCard className="h-5 w-5 text-oranje" />}
            n={2}
            title="Betaal je inleg van €15"
            text="Op de poulepagina staat een QR-code en een betaallink. Eén keer €15 betalen en je speelt het hele WK mee. Geef daarna op de site aan dat je betaald hebt, dan zet de organisator je deelname op actief."
          />
          <Step
            icon={<ListChecks className="h-5 w-5 text-oranje" />}
            n={3}
            title="Voorspel de uitslagen"
            text="Vul per wedstrijd de eindstand in die jij verwacht. Je mag je voorspelling zo vaak aanpassen als je wilt."
          />
          <Step
            icon={<Clock className="h-5 w-5 text-oranje" />}
            n={4}
            title="Let op de deadline"
            text="Een voorspelling staat vast vanaf 10 minuten vóór de aftrap. Daarna kun je die wedstrijd niet meer wijzigen — eerlijk voor iedereen."
          />
          <Step
            icon={<Trophy className="h-5 w-5 text-oranje" />}
            n={5}
            title="Verzamel punten en win"
            text="Na elke wedstrijd worden je punten automatisch bijgewerkt op het klassement. Wie aan het eind bovenaan staat, wint de pot."
          />
        </ol>
      </section>

      {/* Punten */}
      <section className="pixel-card mb-6 p-6">
        <h2 className="pixel-heading mb-5 flex items-center gap-2 text-[0.8rem] text-oranje">
          <Target className="h-5 w-5" /> Hoe verdien je punten?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 border-2 border-green-500/50 bg-green-500/10 p-4">
            <div className="pixel-heading shrink-0 text-base text-green-400">+3</div>
            <div>
              <div className="pixel-heading text-[0.6rem] text-foreground">Exacte uitslag</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Precies goed. Jij zei 2–1 en het werd 2–1.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 border-2 border-oranje/50 bg-oranje/10 p-4">
            <div className="pixel-heading shrink-0 text-base text-oranje">+1</div>
            <div>
              <div className="pixel-heading text-[0.6rem] text-foreground">Juiste uitslag</div>
              <div className="mt-1 text-sm text-muted-foreground">
                De winnaar (of gelijkspel) klopt, maar niet de exacte score. Jij zei 3–0, het werd 2–1.
              </div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Een misser levert 0 punten op, en de punten stapelen niet: een exacte uitslag is 3 punten
          (niet 3 + 1). Simpel gezegd: hoe dichter bij de echte uitslag, hoe meer punten.
        </p>
      </section>

      {/* De pot */}
      <section className="pixel-card mb-8 overflow-hidden p-0">
        <div className="pattern-1988 px-5 py-4">
          <h2 className="pixel-heading flex items-center gap-2 text-xs text-white [text-shadow:1px_1px_0_rgb(0_0_0/0.5)]">
            <PiggyBank className="h-5 w-5" /> Waar gaat je geld heen? (de pot)
          </h2>
        </div>
        <div className="space-y-4 p-6">
          <p className="text-muted-foreground">
            Alle inleg gaat samen in één grote pot. Iedereen legt €15 in, en{" "}
            <span className="text-foreground">die hele pot wordt na het toernooi uitgekeerd aan de winnaars</span>.
            Er blijft dus niets aan de strijkstok hangen — niemand houdt er iets aan over (nee, ook
            niet Bassie 😉). Het geld blijft helemaal binnen de groep deelnemers.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 border-2 border-gold/60 bg-gold/10 p-4">
              <Crown className="h-6 w-6 shrink-0 text-gold" />
              <div>
                <div className="pixel-heading text-[0.6rem] text-gold">1e plaats</div>
                <div className="mt-1 text-sm text-muted-foreground">60% van de pot</div>
              </div>
            </div>
            <div className="flex items-center gap-3 border-2 border-border bg-muted p-4">
              <Medal className="h-6 w-6 shrink-0 text-muted-foreground" />
              <div>
                <div className="pixel-heading text-[0.6rem] text-foreground">2e plaats</div>
                <div className="mt-1 text-sm text-muted-foreground">30% van de pot</div>
              </div>
            </div>
            <div className="flex items-center gap-3 border-2 border-border bg-muted p-4">
              <Target className="h-6 w-6 shrink-0 text-muted-foreground" />
              <div>
                <div className="pixel-heading text-[0.6rem] text-foreground">Poedelprijs</div>
                <div className="mt-1 text-sm text-muted-foreground">10% van de pot</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Voorbeeld: doen er 10 mensen mee, dan is de pot 10 × €15 = €150. De nummer 1 krijgt dan
            €90, de nummer 2 €45 en de poedelprijs (laatste plek) €15.
          </p>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <p className="mb-5 text-lg text-muted-foreground">Snap je het? Mooi — dan kun je los.</p>
        <Link to="/poule">
          <Button size="lg" className="pixel-btn bg-oranje text-primary-foreground hover:bg-oranje-dark">
            Naar de poule
          </Button>
        </Link>
      </div>
    </main>
  );
}

function Step({
  icon,
  n,
  title,
  text,
}: {
  icon: React.ReactNode;
  n: number;
  title: string;
  text: string;
}) {
  return (
    <li className="flex gap-4">
      <div className="flex shrink-0 flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center border-2 border-oranje bg-oranje/10">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="pixel-heading text-[0.65rem] text-foreground">
          <span className="text-oranje">{n}.</span> {title}
        </h3>
        <p className="mt-1.5 text-muted-foreground">{text}</p>
      </div>
    </li>
  );
}
