import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import colors from "../src/theme/colors";

// Root layout. Real providers (Auth, i18n) and the auth gate arrive in Phase 1.
// For Phase 0 this only wires the dark theme + a single screen.
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "fade",
        }}
      />
    </SafeAreaProvider>
  );
}
