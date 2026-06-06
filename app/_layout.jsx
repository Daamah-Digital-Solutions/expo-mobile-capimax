import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";

import "../src/i18n"; // initialize i18next
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { LanguageProvider, useLanguage } from "../src/context/LanguageContext";
import Splash from "../src/components/Splash";
import BiometricSetupScreen from "../src/components/BiometricSetupScreen";

// Hold the native splash until our animated splash overlay takes over (no flash gap).
// The overlay is Lottie or SVG depending on SPLASH_MODE in src/components/Splash.jsx.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Auth gate + themed Stack. Reads theme/auth/language from context (must be inside providers).
function RootNavigator() {
  const { isLoading, isAuthenticated, isLocked, biometricSetupVisible, pendingRoute, setPendingRoute } = useAuth();
  const { isReady: langReady } = useLanguage();
  const { isReady: themeReady, theme, statusBarStyle } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  const booting = isLoading || !langReady || !themeReady;

  useEffect(() => {
    if (booting) return;
    const inAuthGroup = segments[0] === "(auth)";

    // Biometric quick-unlock: a valid session exists but is gated behind the device prompt.
    // The Login screen IS the unlock surface (big Face ID/fingerprint button + email/password
    // fallback), so route there and suppress the normal authenticated→home bounce while locked.
    if (isLocked) {
      if (!inAuthGroup) router.replace("/(auth)/login");
      return;
    }

    // Funds/opportunities are public (matching the web), so we don't force logged-out
    // users to login here. Protected actions/screens prompt for login per-flow.
    // We only bounce an already-authenticated user out of the auth stack (post-login),
    // returning to the intended route if one was saved (Flow A "return to route").
    if (isAuthenticated && inAuthGroup) {
      const dest = pendingRoute || "/(tabs)/home";
      if (pendingRoute) setPendingRoute(null);
      router.replace(dest);
    }
  }, [booting, isAuthenticated, isLocked, segments]);

  if (booting) {
    return (
      <View style={[styles.splash, { backgroundColor: theme.bg }]}>
        <StatusBar style={statusBarStyle} />
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={statusBarStyle} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
          animation: "fade",
        }}
      />
      {/* One-time, post-first-login "enable biometrics?" offer — branded overlay (not a system Alert). */}
      {biometricSetupVisible ? <BiometricSetupScreen /> : null}
    </>
  );
}

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
      {/* Animated splash overlay (Lottie/SVG per SPLASH_MODE) — above everything until done. */}
      {!splashDone && <Splash onFinish={() => setSplashDone(true)} />}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: "center", justifyContent: "center" },
});
