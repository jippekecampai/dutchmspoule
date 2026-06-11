import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Palette, RotateCcw, Check, Trophy } from "lucide-react";
import {
  ACCENT_PRESETS,
  BACKGROUND_PRESETS,
  getStoredCustom,
  saveCustomColors,
  clearCustomColors,
  type CustomColors,
} from "@/lib/theme";

export const Route = createFileRoute("/thema")({
  component: ThemeEditorPage,
});

function ThemeEditorPage() {
  const [colors, setColors] = useState<CustomColors>({});
  const [bgEnabled, setBgEnabled] = useState(false);

  useEffect(() => {
    const stored = getStoredCustom();
    setColors(stored);
    setBgEnabled(!!stored.background);
  }, []);

  const update = (next: CustomColors) => {
    setColors(next);
    saveCustomColors(next);
  };

  const setAccent = (value: string) => update({ ...colors, accent: value });

  const setBackground = (value: string | undefined) => {
    const next = { ...colors };
    if (value) next.background = value;
    else delete next.background;
    update(next);
  };

  const reset = () => {
    clearCustomColors();
    setColors({});
    setBgEnabled(false);
  };

  const accent = colors.accent || "#ff7b24";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Kop */}
      <div className="pixel-card mb-8 overflow-hidden p-0 text-center">
        <div className="pattern-1988 px-5 py-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border-[3px] border-white bg-navy shadow-[4px_4px_0_0_rgb(0_0_0/0.5)]">
            <Palette className="h-6 w-6 text-oranje" />
          </div>
          <h1 className="pixel-heading text-lg text-white [text-shadow:2px_2px_0_rgb(0_0_0/0.6)] sm:text-2xl">
            Eigen kleuren
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg font-medium text-white [text-shadow:1px_1px_0_rgb(0_0_0/0.6)]">
            Kies je eigen accentkleur. Werkt bovenop het gekozen thema en wordt meteen toegepast.
          </p>
        </div>
        <div className="flag-strip" />
      </div>

      {/* Accentkleur */}
      <section className="pixel-card mb-6 p-6">
        <h2 className="pixel-heading mb-4 text-[0.75rem] text-oranje">Accentkleur</h2>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {ACCENT_PRESETS.map((preset) => {
            const active = (colors.accent || "").toLowerCase() === preset.value.toLowerCase();
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => setAccent(preset.value)}
                title={preset.label}
                aria-label={preset.label}
                className={`relative flex aspect-square items-center justify-center border-2 ${
                  active ? "border-foreground" : "border-border"
                }`}
                style={{ backgroundColor: preset.value }}
              >
                {active && <Check className="h-5 w-5 text-white drop-shadow" />}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-3 text-muted-foreground">
            <span>Eigen kleur:</span>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-10 w-14 cursor-pointer border-2 border-border bg-transparent"
              aria-label="Kies een eigen accentkleur"
            />
          </label>
          <span className="font-retro text-foreground">{accent.toUpperCase()}</span>
        </div>
      </section>

      {/* Achtergrond (optioneel) */}
      <section className="pixel-card mb-6 p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="pixel-heading text-[0.75rem] text-oranje">Achtergrond</h2>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={bgEnabled}
              onChange={(e) => {
                const on = e.target.checked;
                setBgEnabled(on);
                setBackground(on ? colors.background || BACKGROUND_PRESETS[0].value : undefined);
              }}
              className="h-4 w-4 accent-[var(--color-oranje)]"
            />
            Eigen achtergrond gebruiken
          </label>
        </div>

        {bgEnabled ? (
          <>
            <div className="grid grid-cols-4 gap-3">
              {BACKGROUND_PRESETS.map((preset) => {
                const active = (colors.background || "").toLowerCase() === preset.value.toLowerCase();
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setBackground(preset.value)}
                    title={preset.label}
                    aria-label={preset.label}
                    className={`relative flex aspect-square items-center justify-center border-2 ${
                      active ? "border-foreground" : "border-border"
                    }`}
                    style={{ backgroundColor: preset.value }}
                  >
                    {active && <Check className="h-5 w-5 text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-3 text-muted-foreground">
                <span>Eigen kleur:</span>
                <input
                  type="color"
                  value={colors.background || BACKGROUND_PRESETS[0].value}
                  onChange={(e) => setBackground(e.target.value)}
                  className="h-10 w-14 cursor-pointer border-2 border-border bg-transparent"
                  aria-label="Kies een eigen achtergrondkleur"
                />
              </label>
              <span className="font-retro text-foreground">
                {(colors.background || BACKGROUND_PRESETS[0].value).toUpperCase()}
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            De achtergrond van het gekozen thema blijft staan. Zet dit aan om hem te overschrijven.
          </p>
        )}
      </section>

      {/* Live voorbeeld */}
      <section className="pixel-card mb-6 p-6">
        <h2 className="pixel-heading mb-4 text-[0.75rem] text-oranje">Voorbeeld</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button className="pixel-btn bg-oranje text-primary-foreground hover:bg-oranje-dark">
            Voorbeeldknop
          </Button>
          <span className="pixel-heading text-sm">
            <span className="text-oranje">★</span> Accent <span className="text-oranje">★</span>
          </span>
          <span className="inline-flex items-center gap-1.5 border-2 border-oranje/50 bg-oranje/10 px-3 py-1 text-sm text-oranje-light">
            <Trophy className="h-4 w-4" /> Voorbeeldlabel
          </span>
        </div>
      </section>

      {/* Acties */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Wijzigingen worden meteen opgeslagen in deze browser.
        </p>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="rounded-none hover:bg-oranje/15"
            onClick={reset}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Standaard herstellen
          </Button>
          <Link to="/">
            <Button className="pixel-btn bg-oranje text-primary-foreground hover:bg-oranje-dark">
              Klaar
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
