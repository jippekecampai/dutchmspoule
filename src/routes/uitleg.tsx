import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
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
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Kop */}
      <div className="pixel-card mb-8 overflow-hidden p-0 text-center">
        <div className="pattern-1988 px-5 py-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border-[3px] border-white bg-navy shadow-[4px_4px_0_0_rgb(0_0_0/0.5)]">
            <HelpCircle className="h-6 w-6 text-oranje" />
          </div>
          <h1 className="pixel-heading text-lg text-white [text-shadow:2px_2px_0_rgb(0_0_0/0.6)] sm:text-2xl">
            {t("Hoe werkt het?", "How does it work?")}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg font-medium text-white [text-shadow:1px_1px_0_rgb(0_0_0/0.6)]">
            {t("De complete uitleg — ook als je nog nooit hebt meegedaan aan een poule.", "The complete guide — even if you have never joined a prediction pool before.")}
          </p>
        </div>
        <div className="flag-strip" />
      </div>

      {/* Wat is een poule? */}
      <section className="pixel-card mb-6 p-6">
        <h2 className="pixel-heading mb-4 flex items-center gap-2 text-[0.8rem] text-oranje">
          <Target className="h-5 w-5" /> {t("Wat is een voetbalpoule?", "What is a football pool?")}
        </h2>
        <div className="space-y-3 text-muted-foreground">
          <p>
            {t("Een voetbalpoule is een spelletje tussen vrienden, familie of collega's. Je probeert te ", "A football pool is a game between friends, family or colleagues. You try to ")}
            <span className="text-foreground">{t("voorspellen hoe de wedstrijden van Nederland aflopen", "predict how the Netherlands' matches will end")}</span>.
            {t(' Voor elke wedstrijd vul je van tevoren in wat volgens jou de eindstand wordt, bijvoorbeeld "Nederland 2 – Japan 1".', ' For each match you enter in advance what you think the final score will be, for example "Netherlands 2 – Japan 1".')}
          </p>
          <p>
            {t("Zit je voorspelling goed? Dan verdien je punten. Iedereen die meedoet, voorspelt dezelfde wedstrijden, en aan het eind van het toernooi heeft ", "Got it right? Then you earn points. Everyone in the pool predicts the same matches, and at the end of the tournament ")}
            <span className="text-foreground">{t("degene met de meeste punten gewonnen", "the person with the most points wins")}</span>.
          </p>
          <p className="border-l-4 border-oranje/50 pl-4 text-sm">
            {t("Het is dus geen gokken bij een wedkantoor — het is gewoon onder elkaar wie het beste het Nederlands elftal kan inschatten. Een beetje geluk en een beetje verstand van voetbal. 🍊", "So it is not betting at a bookmaker — it is simply a friendly contest about who can read the Dutch team best. A bit of luck and a bit of football sense. 🍊")}
          </p>
        </div>
      </section>

      {/* Stap voor stap */}
      <section className="pixel-card mb-6 p-6">
        <h2 className="pixel-heading mb-5 flex items-center gap-2 text-[0.8rem] text-oranje">
          <ListChecks className="h-5 w-5" /> {t("Stap voor stap", "Step by step")}
        </h2>
        <ol className="space-y-5">
          <Step
            icon={<UserPlus className="h-5 w-5 text-oranje" />}
            n={1}
            title={t("Maak een account", "Create an account")}
            text={t("Log in met Google, Apple of je e-mailadres. Daarmee bewaren we jouw voorspellingen.", "Log in with Google, Apple or your email address. That is how we store your predictions.")}
          />
          <Step
            icon={<CreditCard className="h-5 w-5 text-oranje" />}
            n={2}
            title={t("Betaal je inleg van €15", "Pay your €15 entry fee")}
            text={t("Op de poulepagina staat een QR-code en een betaallink. Eén keer €15 betalen en je speelt het hele WK mee. Geef daarna op de site aan dat je betaald hebt, dan zet de organisator je deelname op actief.", "The pool page has a QR code and a payment link. Pay €15 once and you play the whole World Cup. Afterwards mark on the site that you paid, and the organiser will activate your entry.")}
          />
          <Step
            icon={<ListChecks className="h-5 w-5 text-oranje" />}
            n={3}
            title={t("Voorspel de uitslagen", "Predict the results")}
            text={t("Vul per wedstrijd de eindstand in die jij verwacht. Je mag je voorspelling zo vaak aanpassen als je wilt.", "Enter the final score you expect for each match. You can change your prediction as often as you like.")}
          />
          <Step
            icon={<Clock className="h-5 w-5 text-oranje" />}
            n={4}
            title={t("Let op de deadline", "Mind the deadline")}
            text={t("Een voorspelling staat vast vanaf 10 minuten vóór de aftrap. Daarna kun je die wedstrijd niet meer wijzigen — eerlijk voor iedereen.", "A prediction locks 10 minutes before kick-off. After that you cannot change that match any more — fair for everyone.")}
          />
          <Step
            icon={<Trophy className="h-5 w-5 text-oranje" />}
            n={5}
            title={t("Verzamel punten en win", "Collect points and win")}
            text={t("Na elke wedstrijd worden je punten automatisch bijgewerkt op het klassement. Wie aan het eind bovenaan staat, wint de pot.", "After every match your points are updated automatically on the standings. Whoever is on top at the end wins the pot.")}
          />
        </ol>
      </section>

      {/* Punten */}
      <section className="pixel-card mb-6 p-6">
        <h2 className="pixel-heading mb-5 flex items-center gap-2 text-[0.8rem] text-oranje">
          <Target className="h-5 w-5" /> {t("Hoe verdien je punten?", "How do you earn points?")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 border-2 border-green-500/50 bg-green-500/10 p-4">
            <div className="pixel-heading shrink-0 text-base text-green-400">+3</div>
            <div>
              <div className="pixel-heading text-[0.6rem] text-foreground">{t("Exacte uitslag", "Exact score")}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {t("Precies goed. Jij zei 2–1 en het werd 2–1.", "Spot on. You said 2–1 and it ended 2–1.")}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 border-2 border-oranje/50 bg-oranje/10 p-4">
            <div className="pixel-heading shrink-0 text-base text-oranje">+1</div>
            <div>
              <div className="pixel-heading text-[0.6rem] text-foreground">{t("Juiste uitslag", "Correct outcome")}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {t("De winnaar (of gelijkspel) klopt, maar niet de exacte score. Jij zei 3–0, het werd 2–1.", "The winner (or draw) is right, but not the exact score. You said 3–0, it ended 2–1.")}
              </div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("Een misser levert 0 punten op, en de punten stapelen niet: een exacte uitslag is 3 punten (niet 3 + 1). Simpel gezegd: hoe dichter bij de echte uitslag, hoe meer punten.", "A miss earns 0 points, and points do not stack: an exact score is 3 points (not 3 + 1). Simply put: the closer to the real result, the more points.")}
        </p>
      </section>

      {/* De pot */}
      <section className="pixel-card mb-8 overflow-hidden p-0">
        <div className="pattern-1988 px-5 py-4">
          <h2 className="pixel-heading flex items-center gap-2 text-xs text-white [text-shadow:1px_1px_0_rgb(0_0_0/0.5)]">
            <PiggyBank className="h-5 w-5" /> {t("Waar gaat je geld heen? (de pot)", "Where does your money go? (the pot)")}
          </h2>
        </div>
        <div className="space-y-4 p-6">
          <p className="text-muted-foreground">
            {t("Alle inleg gaat samen in één grote pot. Iedereen legt €15 in, en ", "All entry fees go into one big pot. Everyone puts in €15, and ")}
            <span className="text-foreground">{t("die hele pot wordt na het toernooi uitgekeerd aan de winnaars", "the entire pot is paid out to the winners after the tournament")}</span>.
            {t(" Er blijft dus niets aan de strijkstok hangen — niemand houdt er iets aan over (nee, ook niet Bassie 😉). Het geld blijft helemaal binnen de groep deelnemers.", " Nothing sticks to anyone's fingers — nobody keeps a cut (no, not even Bassie 😉). The money stays entirely within the group of players.")}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 border-2 border-gold/60 bg-gold/10 p-4">
              <Crown className="h-6 w-6 shrink-0 text-gold" />
              <div>
                <div className="pixel-heading text-[0.6rem] text-gold">{t("1e plaats", "1st place")}</div>
                <div className="mt-1 text-sm text-muted-foreground">{t("60% van de pot", "60% of the pot")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 border-2 border-border bg-muted p-4">
              <Medal className="h-6 w-6 shrink-0 text-muted-foreground" />
              <div>
                <div className="pixel-heading text-[0.6rem] text-foreground">{t("2e plaats", "2nd place")}</div>
                <div className="mt-1 text-sm text-muted-foreground">{t("30% van de pot", "30% of the pot")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 border-2 border-border bg-muted p-4">
              <Target className="h-6 w-6 shrink-0 text-muted-foreground" />
              <div>
                <div className="pixel-heading text-[0.6rem] text-foreground">{t("Poedelprijs", "Wooden spoon")}</div>
                <div className="mt-1 text-sm text-muted-foreground">{t("10% van de pot", "10% of the pot")}</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("Voorbeeld: doen er 10 mensen mee, dan is de pot 10 × €15 = €150. De nummer 1 krijgt dan €90, de nummer 2 €45 en de poedelprijs (laatste plek) €15.", "Example: with 10 players the pot is 10 × €15 = €150. Number 1 then gets €90, number 2 gets €45 and the wooden spoon (last place) gets €15.")}
          </p>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <p className="mb-5 text-lg text-muted-foreground">{t("Snap je het? Mooi — dan kun je los.", "Got it? Great — off you go.")}</p>
        <Link to="/poule">
          <Button size="lg" className="pixel-btn bg-oranje text-primary-foreground hover:bg-oranje-dark">
            {t("Naar de poule", "To the pool")}
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
