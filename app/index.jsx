import { Redirect } from "expo-router";
import { useAuth } from "../src/context/AuthContext";

// Entry redirect. Authenticated users go straight to the tabs (as before). Unauthenticated
// users see the onboarding sliders first (every launch, before login) → onboarding routes to auth.
export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();
  if (isLoading) return null; // providers still booting (root layout shows the splash)
  return <Redirect href={isAuthenticated ? "/(tabs)/home" : "/onboarding"} />;
}
