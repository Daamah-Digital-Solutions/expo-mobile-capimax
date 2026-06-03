// ThemeContext — light/dark theming (CLAUDE.md §9).
// - mode: 'auto' (follow system via Appearance) | 'dark' | 'light', persisted in AsyncStorage.
// - Resolves to a palette and re-renders live on system/manual change (no reload).
// - Flips StatusBar style and the native root/nav background (expo-system-ui) accordingly.
// Every component reads colors through useTheme().theme — never a static import.
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SystemUI from "expo-system-ui";
import { palettes } from "../theme/palettes";
import { spacing, radii, radius, type, motion, makeElevation } from "../theme/tokens";

const MODE_KEY = "app.themeMode"; // sits alongside the language preference
export const THEME_MODES = ["auto", "light", "dark"];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState("auto");
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() || "light");
  const [isReady, setIsReady] = useState(false);

  // Load saved mode + subscribe to OS appearance changes.
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(MODE_KEY);
        if (THEME_MODES.includes(saved)) setModeState(saved);
      } finally {
        setIsReady(true);
      }
    })();

    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme || "light");
    });
    return () => sub.remove();
  }, []);

  const scheme = mode === "auto" ? systemScheme : mode; // resolved 'dark' | 'light'
  const theme = palettes[scheme] || palettes.dark;
  const statusBarStyle = scheme === "dark" ? "light" : "dark";

  // Keep the native background (under the JS view / nav bar) in sync with the theme.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.bg).catch(() => {});
  }, [theme.bg]);

  const setMode = useCallback(async (next) => {
    if (!THEME_MODES.includes(next)) return;
    setModeState(next);
    await AsyncStorage.setItem(MODE_KEY, next);
  }, []);

  const elevation = useCallback((level) => makeElevation(scheme, theme, level), [scheme, theme]);

  const value = useMemo(
    () => ({
      mode,
      scheme,
      theme,
      radius,
      radii,
      spacing,
      type,
      motion,
      elevation,
      statusBarStyle,
      setMode,
      isReady,
    }),
    [mode, scheme, theme, elevation, statusBarStyle, setMode, isReady]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

export default ThemeContext;
