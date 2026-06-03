import { Stack } from "expo-router";
import { useTheme } from "../../src/context/ThemeContext";

// Auth stack. Real screens are built in Phase 2; these are placeholders for now.
export default function AuthLayout() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
      }}
    />
  );
}
