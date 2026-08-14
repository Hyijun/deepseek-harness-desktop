import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Language, Translation } from "./index";
import { translations } from "./index";

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  lang: (obj: Record<Language, string>) => string;
  dict: Translation;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = "dsh-website-language";

function getTranslation(
  obj: Translation,
  keyPath: string,
  params?: Record<string, string | number>,
): string {
  const keys = keyPath.split(".");
  let value: unknown = obj;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return keyPath;
    }
  }

  if (typeof value !== "string") {
    return keyPath;
  }

  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
      return params[name]?.toString() ?? match;
    });
  }
  return value;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const getInitialLanguage = (): Language => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "zh" || saved === "en") {
      return saved;
    }
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith("zh") ? "zh" : "en";
  };

  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(translations[language], key, params);

  const lang = (obj: Record<Language, string>) => obj[language];

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.title =
      language === "zh"
        ? "DeepSeek Harness Desktop — 一键本地运行 DeepSeek Harness"
        : "DeepSeek Harness Desktop — Run DeepSeek Harness locally";
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, lang, dict: translations[language] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

/** Cast a nested dictionary value to a translation map. */
export function sectionMap(value: unknown): Translation {
  return value as Translation;
}

/** Cast a nested dictionary value to a typed list. */
export function sectionList<T>(value: unknown): T[] {
  return value as T[];
}
