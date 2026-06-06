// Google OAuth config. Client IDs are read from app.json extra.google.*.
//
// The backend verifies the ID token's audience against the WEB client id, so webClientId must
// always be set (it is, now). Completing the native OAuth flow on a device additionally needs the
// platform's NATIVE client id (iosClientId on iOS, androidClientId on Android) + its redirect
// scheme. Until those native IDs are provided, the "Continue with Google" button stays inactive
// with a small note — flipping it on later requires no code change.
import { Platform } from "react-native";
import Constants from "expo-constants";

const cfg = Constants.expoConfig?.extra?.google || {};

export const googleClientIds = {
  iosClientId: cfg.iosClientId || undefined,
  androidClientId: cfg.androidClientId || undefined,
  webClientId: cfg.webClientId || undefined,
  expoClientId: cfg.expoClientId || undefined,
};

// Active only when we have the web client id (audience) AND the native client id for THIS platform.
export function isGoogleConfigured() {
  if (!googleClientIds.webClientId) return false;
  if (Platform.OS === "ios") return Boolean(googleClientIds.iosClientId);
  if (Platform.OS === "android") return Boolean(googleClientIds.androidClientId);
  // web/other: the web client id is sufficient.
  return Boolean(googleClientIds.webClientId);
}
