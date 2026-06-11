import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Palette, Check, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEMES, getStoredTheme, applyTheme, type ThemeId } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";

export function ThemeSwitcher() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeId>("oranje");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  const select = (id: ThemeId) => {
    setTheme(id);
    applyTheme(id);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 rounded-none text-base hover:bg-oranje/20 hover:text-oranje-light"
        onClick={() => setOpen((o) => !o)}
        aria-label="Kies thema"
      >
        <Palette className="h-4 w-4" />
        <span className="hidden sm:inline">{t("Thema", "Theme")}</span>
      </Button>
      {open && (
        <div className="pixel-card absolute right-0 z-50 mt-2 w-52 p-1">
          {THEMES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => select(option.id)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-oranje/15"
            >
              <span className="text-foreground">{option.label}</span>
              {theme === option.id && <Check className="h-4 w-4 shrink-0 text-oranje" />}
            </button>
          ))}
          <div className="my-1 border-t border-oranje/20" />
          <Link
            to="/thema"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-oranje hover:bg-oranje/15"
          >
            <Sliders className="h-4 w-4 shrink-0" />
            {t("Eigen kleuren…", "Custom colours…")}
          </Link>
        </div>
      )}
    </div>
  );
}
