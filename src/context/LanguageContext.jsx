// LanguageContext — language + deterministic RTL (CLAUDE.md §8, DESIGN.md §10).
//
// RTL correctness rule: English = LTR always, Arabic = RTL always — including after login and
// after a full reload. The native I18nManager RTL flag only applies after an app reload, so we
// reconcile it with the saved language at boot (and on change): if native direction != language,
// force the correct direction and do a ONE-TIME full reload (expo-updates). A persisted guard
// prevents any reload loop. Preference is non-sensitive → AsyncStorage.
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";
import i18n, { isRTLLanguage, SUPPORTED_LANGUAGES } from "../i18n";

const STORAGE_KEY = "app.language";
const RELOAD_GUARD = "app.rtl.reloadGuard";
const LanguageContext = createContext(null);

async function reloadApp() {
  try {
    await Updates.reloadAsync();
  } catch (e) {
    // Dev fallback (Updates.reloadAsync can be unavailable in some dev contexts).
    try {
      const { DevSettings } = require("react-native");
      DevSettings.reload();
    } catch {}
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("en");
  const [isReady, setIsReady] = useState(false);

  // Boot: load saved language, then make sure the NATIVE RTL direction matches it.
  useEffect(() => {
    (async () => {
      let lng = "en";
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (SUPPORTED_LANGUAGES.includes(saved)) lng = saved;
      } catch {}

      await i18n.changeLanguage(lng);
      setLanguageState(lng);

      const desiredRTL = isRTLLanguage(lng); // en → false, ar → true
      I18nManager.allowRTL(desiredRTL);

      if (I18nManager.isRTL !== desiredRTL) {
        // Native direction is stale (e.g. English stuck RTL from a previous Arabic session).
        const guarded = await AsyncStorage.getItem(RELOAD_GUARD);
        if (guarded) {
          // We already reloaded once and it still didn't apply — don't loop. Render anyway;
          // components also mirror via the language-derived isRTL flag.
          await AsyncStorage.removeItem(RELOAD_GUARD);
          setIsReady(true);
        } else {
          await AsyncStorage.setItem(RELOAD_GUARD, "1");
          I18nManager.forceRTL(desiredRTL);
          await reloadApp(); // one-time reload to apply the correct direction; do not mark ready
        }
      } else {
        await AsyncStorage.removeItem(RELOAD_GUARD);
        setIsReady(true);
      }
    })();
  }, []);

  const setLanguage = useCallback(async (lng) => {
    if (!SUPPORTED_LANGUAGES.includes(lng)) return;
    await AsyncStorage.setItem(STORAGE_KEY, lng);

    const desiredRTL = isRTLLanguage(lng);
    if (I18nManager.isRTL !== desiredRTL) {
      // Direction actually changes (en↔ar) → must reload to apply the native flip.
      I18nManager.allowRTL(desiredRTL);
      I18nManager.forceRTL(desiredRTL);
      await AsyncStorage.setItem(RELOAD_GUARD, "1"); // boot clears it once applied
      await reloadApp();
    } else {
      // Same direction (shouldn't happen for en↔ar, but safe) → no reload needed.
      await i18n.changeLanguage(lng);
      setLanguageState(lng);
    }
  }, []);

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
