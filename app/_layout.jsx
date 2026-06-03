import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import "../src/i18n"; // initialize i18next
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { LanguageProvider, useLanguage } from "../src/context/LanguageContext";

// Auth gate + themed Stack. Reads theme/auth/language from context (must be inside providers).
function RootNavigator() {
  const { isLoading, isAuthenticated, pendingRoute, setPendingRoute } = useAuth();
  const { isReady: langReady } = useLanguage();
  const { isReady: themeReady, theme, statusBarStyle } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  const booting = isLoading || !langReady || !themeReady;

  useEffect(() => {
    if (booting) return;
    const inAuthGroup = segments[0] === "(auth)";
    // Funds/opportunities are public (matching the web), so we don't force logged-out
    // users to login here. Protected actions/screens prompt for login per-flow.
    // We only bounce an already-authenticated user out of the auth stack (post-login),
    // returning to the intended route if one was saved (Flow A "return to route").
    if (isAuthenticated && inAuthGroup) {
      const dest = pendingRoute || "/(tabs)/funds";
      if (pendingRoute) setPendingRoute(null);
      router.replace(dest);
    }
  }, [booting, isAuthenticated, segments]);

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
    </>
  );
}

export default function RootLayout() {
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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: "center", justifyContent: "center" },
});
