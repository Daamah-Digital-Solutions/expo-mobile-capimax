// Google OAuth config. Client IDs are read from app.json extra.google.*.
//
// Used by the native Google Sign-In SDK (@react-native-google-signin/google-signin):
//   • webClientId  → passed to GoogleSignin.configure() as the server client id, so the returned
//                    id_token's `aud` is the WEB client id (what the backend verifies). REQUIRED.
//   • iosClientId  → the iOS device flow (Android uses package + SHA-1, no client id needed in JS).
// The button activates when webClientId + the platform's native client id are present.
import { Platform } from "react-native";
import Constants from "expo-constants";

const cfg = Constants.expoConfig?.extra?.google || {};

export const googleClientIds = {
  iosClientId: cfg.iosClientId || undefined,
  androidClientId: cfg.androidClientId || undefined,
  webClientId: cfg.webClientId || undefined,
  expoClientId: cfg.expoClientId || undefined,
};

// Active when we have the web client id (= serverClientId, the audience the backend verifies) plus,
// on iOS, the iOS client id. Android needs no client id in JS — the native SDK signs in with
// webClientId (serverClientId) and matches the app by package name + SHA-1 registered in the project.
export function isGoogleConfigured() {
  if (!googleClientIds.webClientId) return false;
  if (Platform.OS === "ios") return Boolean(googleClientIds.iosClientId);
  if (Platform.OS === "android") return true;
  // web/other: the web client id is sufficient.
  return Boolean(googleClientIds.webClientId);
}
