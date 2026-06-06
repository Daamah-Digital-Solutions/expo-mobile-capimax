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
  const { isLoading, isAuthenticated, isLocked, onboardingDone, biometricSetupVisible, pendingRoute, setPendingRoute } = useAuth();
  const { isReady: langReady } = useLanguage();
  const { isReady: themeReady, theme, statusBarStyle } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  const booting = isLoading || !langReady || !themeReady;

  useEffect(() => {
    if (booting) return;
    const seg0 = segments[0];
    const inAuthGroup = seg0 === "(auth)";
    const onOnboarding = seg0 === "onboarding";

    // Fully authenticated (and not locked) → into the app. Bounce out of the auth stack /
    // onboarding to the intended route (Flow A "return to route") or home.
    if (isAuthenticated && !isLocked) {
      if (inAuthGroup || onOnboarding) {
        const dest = pendingRoute || "/(tabs)/home";
        if (pendingRoute) setPendingRoute(null);
        router.replace(dest);
      }
      return;
    }

    // Locked (a valid session exists + biometrics enabled) → straight to the Login/unlock surface
    // with the biometric button. A locked user is a returning user, NOT logged-out, so they skip
    // onboarding entirely.
    if (isLocked) {
      if (!inAuthGroup) router.replace("/(auth)/login");
      return;
    }

    // Truly logged-out (no stored session). Onboarding runs ONCE per launch BEFORE the auth/login
    // screens. Enforce it here so the flow holds even when the router lands directly on
    // /(auth)/login (e.g. restoring the post-sign-out route on relaunch).
    if (!onboardingDone) {
      if (!onOnboarding) router.replace("/onboarding");
    }
  }, [booting, isAuthenticated, isLocked, onboardingDone, segments]);

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
