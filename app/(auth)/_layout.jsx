import { Stack } from "expo-router";
import colors from "../../src/theme/colors";

// Auth stack. Real screens are built in Phase 2; these are placeholders for now.
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
