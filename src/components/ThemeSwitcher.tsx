import { useEffect, useRef, useState } from "react";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEMES, getStoredTheme, applyTheme, type ThemeId } from "@/lib/theme";

export function ThemeSwitcher() {
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
        <span className="hidden sm:inline">Thema</span>
      </Button>
      {open && (
        <div className="pixel-card absolute right-0 z-50 mt-2 w-56 p-1">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => select(t.id)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-oranje/15"
            >
              <span>
                <span className="block text-foreground">{t.label}</span>
                <span className="block text-sm text-muted-foreground">{t.description}</span>
              </span>
              {theme === t.id && <Check className="h-4 w-4 shrink-0 text-oranje" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
