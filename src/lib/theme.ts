export type ThemeId = "oranje" | "reinier" | "roland";

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: "oranje", label: "Default - '88" },
  { id: "reinier", label: "Retro (Nintendo)" },
  { id: "roland", label: "Saai (RoStyle)" },
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

/* -------------------------------------------------------------------------
 * Eigen kleuren — overschrijven het accent (en optioneel de achtergrond)
 * van het gekozen thema. Wordt live toegepast en per browser bewaard.
 * ---------------------------------------------------------------------- */

export type CustomColors = {
  accent?: string;
  background?: string;
};

export const CUSTOM_STORAGE_KEY = "dutchmsp-custom-colors";

export const ACCENT_PRESETS: { label: string; value: string }[] = [
  { label: "Oranje", value: "#ff7b24" },
  { label: "Roze", value: "#ff4fa3" },
  { label: "Rood", value: "#e23030" },
  { label: "Blauw", value: "#2f6df6" },
  { label: "Groen", value: "#1ca35a" },
  { label: "Paars", value: "#8b5cf6" },
  { label: "Goud", value: "#e6b400" },
  { label: "Cyaan", value: "#19c2c2" },
];

// Aangeraden achtergronden (donker, in stijl van de app).
export const BACKGROUND_PRESETS: { label: string; value: string }[] = [
  { label: "Nachtblauw", value: "#0f1530" },
  { label: "Zwart", value: "#0a0a0a" },
  { label: "Donkergroen", value: "#0e1f17" },
  { label: "Aubergine", value: "#1c1024" },
];

const CUSTOM_VAR_KEYS = ["--oranje", "--oranje-light", "--oranje-dark", "--primary", "--ring", "--background"];

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function toHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((x) => clampByte(x).toString(16).padStart(2, "0")).join("");
}

export function lighten(hex: string, amt: number) {
  const c = parseHex(hex);
  if (!c) return hex;
  return toHex(c.r + (255 - c.r) * amt, c.g + (255 - c.g) * amt, c.b + (255 - c.b) * amt);
}

export function darken(hex: string, amt: number) {
  const c = parseHex(hex);
  if (!c) return hex;
  return toHex(c.r * (1 - amt), c.g * (1 - amt), c.b * (1 - amt));
}

export function getStoredCustom(): CustomColors {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomColors) : {};
  } catch {
    return {};
  }
}

export function applyCustomColors(c: CustomColors) {
  if (typeof document === "undefined") return;
  const root = document.documentElement.style;
  CUSTOM_VAR_KEYS.forEach((v) => root.removeProperty(v));
  if (c.accent && parseHex(c.accent)) {
    root.setProperty("--oranje", c.accent);
    root.setProperty("--oranje-light", lighten(c.accent, 0.18));
    root.setProperty("--oranje-dark", darken(c.accent, 0.18));
    root.setProperty("--primary", c.accent);
    root.setProperty("--ring", c.accent);
  }
  if (c.background && parseHex(c.background)) {
    root.setProperty("--background", c.background);
  }
}

export function saveCustomColors(c: CustomColors) {
  try {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(c));
  } catch {
    // negeer opslagfouten
  }
  applyCustomColors(c);
}

export function clearCustomColors() {
  try {
    localStorage.removeItem(CUSTOM_STORAGE_KEY);
  } catch {
    // negeer opslagfouten
  }
  if (typeof document !== "undefined") {
    CUSTOM_VAR_KEYS.forEach((v) => document.documentElement.style.removeProperty(v));
  }
}
