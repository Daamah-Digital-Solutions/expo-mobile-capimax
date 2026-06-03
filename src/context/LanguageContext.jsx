// LanguageContext — current language + RTL handling (CLAUDE.md §8).
// Preference is non-sensitive → stored in AsyncStorage (not SecureStore).
// Switching to Arabic enables RTL via I18nManager. A full native layout flip needs an app
// reload; the JS direction (`direction`) is exposed so components can adapt immediately.
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n, { isRTLLanguage, SUPPORTED_LANGUAGES } from "../i18n";

const STORAGE_KEY = "app.language";
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(i18n.language || "en");
  const [isReady, setIsReady] = useState(false);

  const applyLanguage = useCallback(async (lng) => {
    await i18n.changeLanguage(lng);
    const rtl = isRTLLanguage(lng);
    I18nManager.allowRTL(rtl);
    if (I18nManager.isRTL !== rtl) {
      // Takes full effect after the next app reload; text/labels update immediately.
      I18nManager.forceRTL(rtl);
    }
    setLanguageState(lng);
  }, []);

  // Load saved preference on mount.
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const lng = SUPPORTED_LANGUAGES.includes(saved) ? saved : "en";
        await applyLanguage(lng);
      } finally {
        setIsReady(true);
      }
    })();
  }, [applyLanguage]);

  const setLanguage = useCallback(
    async (lng) => {
      if (!SUPPORTED_LANGUAGES.includes(lng)) return;
      await AsyncStorage.setItem(STORAGE_KEY, lng);
      await applyLanguage(lng);
    },
    [applyLanguage]
  );

  const value = {
    language,
    isRTL: isRTLLanguage(language),
    direction: isRTLLanguage(language) ? "rtl" : "ltr",
    setLanguage,
    isReady,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}

export default LanguageContext;
