import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import "../src/i18n"; // initialize i18next
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { LanguageProvider, useLanguage } from "../src/context/LanguageContext";
import colors from "../src/theme/colors";

// Auth gate: keep unauthenticated users in the (auth) group, authenticated users out of it.
function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();
  const { isReady } = useLanguage();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isReady) return;
    const inAuthGroup = segments[0] === "(auth)";
    // Funds/opportunities are public (matching the web), so we don't force logged-out
    // users to login here. Protected actions/screens prompt for login per-flow.
    // We only bounce an already-authenticated user out of the auth stack (post-login).
    if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)/funds");
    }
  }, [isLoading, isReady, isAuthenticated, segments]);

  if (isLoading || !isReady) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primaryLight} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: "fade",
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LanguageProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});
