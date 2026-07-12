import { create } from "zustand";
import type { Locale } from "@/lib/i18n/locales";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  locale: "zh", // Default to Chinese
  setLocale: (locale) => set({ locale }),
  t: (key, vars) => {
    const { locale } = get();
    // Dynamic import would be async, so we use a synchronous approach
    // The actual translations are loaded via the provider
    return key; // This will be overridden by the provider
  },
}));
