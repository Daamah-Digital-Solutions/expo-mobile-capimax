import { Redirect } from "expo-router";
import { useAuth } from "../src/context/AuthContext";

// Entry redirect (kept in sync with the auth gate in app/_layout.jsx).
// - Authenticated (not locked) → tabs home.
// - Locked (stored session + biometrics) → Login/unlock surface (returning user, skips onboarding).
// - Truly logged-out → onboarding every launch, until completed → then login.
export default function Index() {
  const { isLoading, isAuthenticated, isLocked, onboardingDone } = useAuth();
  if (isLoading) return null; // providers still booting (root layout shows the splash)
  if (isAuthenticated && !isLocked) return <Redirect href="/(tabs)/home" />;
  if (isLocked) return <Redirect href="/(auth)/login" />;
  if (!onboardingDone) return <Redirect href="/onboarding" />;
  return <Redirect href="/(auth)/login" />;
}
