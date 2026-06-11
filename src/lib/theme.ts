export type ThemeId = "oranje" | "reinier" | "roland";

export const THEMES: { id: ThemeId; label: string; description: string }[] = [
  { id: "oranje", label: "Oranje '88", description: "Voor de rest" },
  { id: "reinier", label: "Reinier", description: "Nintendo-stijl" },
  { id: "roland", label: "Roland", description: "Lekker saai" },
];

export const DEFAULT_THEME: ThemeId = "oranje";
export const THEME_STORAGE_KEY = "dutchmsp-theme";

export function getStoredTheme(): ThemeId {
  if (typeof localStorage === "undefined") return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
    if (stored && THEMES.some((t) => t.id === stored)) return stored;
  } catch {
    // localStorage niet beschikbaar
  }
  return DEFAULT_THEME;
}

export function applyTheme(theme: ThemeId) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // negeer opslagfouten
  }
}
