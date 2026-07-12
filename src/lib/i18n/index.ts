import { locales, type Locale } from "./locales";

export type { Locale };

let currentLocale: Locale = "zh";

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: string, vars?: Record<string, string>): string {
  const text = locales[currentLocale][key] || locales["en"][key] || key;
  if (vars) {
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replace(`{${k}}`, v),
      text
    );
  }
  return text;
}

export function useTranslation(locale: Locale) {
  return {
    t: (key: string, vars?: Record<string, string>) => {
      const text = locales[locale][key] || locales["en"][key] || key;
      if (vars) {
        return Object.entries(vars).reduce(
          (acc, [k, v]) => acc.replace(`{${k}}`, v),
          text
        );
      }
      return text;
    },
  };
}
