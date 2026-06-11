import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/*
 * Lichtgewicht NL/EN-vertaling: t(nl, en) geeft de tekst in de gekozen taal.
 * De keuze wordt per browser bewaard; NL is de standaard.
 */

export type Lang = "nl" | "en";

export const LANG_STORAGE_KEY = "dutchmsp-lang";

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (nl: string, en: string) => string;
};

const I18nContext = createContext<I18nValue>({
  lang: "nl",
  setLang: () => {},
  t: (nl) => nl,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("nl");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY);
      if (stored === "en" || stored === "nl") setLangState(stored);
    } catch {
      // localStorage niet beschikbaar
    }
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // negeer opslagfouten
    }
  };

  const t = (nl: string, en: string) => (lang === "en" ? en : nl);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
