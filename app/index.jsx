import { Redirect } from "expo-router";

// Entry redirect. Funds is the public landing (matching the web); login is reached from
// the More tab or per-flow when a protected action requires it.
export default function Index() {
  return <Redirect href="/(tabs)/funds" />;
}
