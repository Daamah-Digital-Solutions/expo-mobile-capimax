import { Redirect } from "expo-router";
import { useAuth } from "../src/context/AuthContext";

// Entry redirect.
// - Locked (valid session + biometric enabled) → Login screen, which is the unlock surface.
// - Authenticated → tabs home.
// - Otherwise → onboarding sliders (every launch, before login) → onboarding routes to auth.
export default function Index() {
  const { isLoading, isAuthenticated, isLocked } = useAuth();
  if (isLoading) return null; // providers still booting (root layout shows the splash)
  if (isLocked) return <Redirect href="/(auth)/login" />;
  return <Redirect href={isAuthenticated ? "/(tabs)/home" : "/onboarding"} />;
}
