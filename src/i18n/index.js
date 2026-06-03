// i18n setup — react-i18next + i18next, same lib as the web (CLAUDE.md §8).
// Translation files copied verbatim from the web (public/locales/{en,ar}/translation.json).
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../locales/en.json";
import ar from "../locales/ar.json";

export const SUPPORTED_LANGUAGES = ["en", "ar"];
export const RTL_LANGUAGES = ["ar"];

export function isRTLLanguage(lng) {
  return RTL_LANGUAGES.includes(lng);
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: "en", // LanguageContext overrides this once the saved preference loads
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false },
    returnNull: false,
    returnEmptyString: false,
    react: { useSuspense: false },
  });
}

export default i18n;
