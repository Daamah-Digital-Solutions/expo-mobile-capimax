// Google OAuth config (deferred — OQ#10). Client IDs are read from app.json extra.google.*.
// Until the owner provides them, isGoogleConfigured() is false and the UI shows a disabled
// "Continue with Google" button. When the IDs are added, the button activates with no code change.
import Constants from "expo-constants";

const cfg = Constants.expoConfig?.extra?.google || {};

export const googleClientIds = {
  iosClientId: cfg.iosClientId,
  androidClientId: cfg.androidClientId,
  webClientId: cfg.webClientId,
  expoClientId: cfg.expoClientId,
};

export function isGoogleConfigured() {
  return Boolean(
    googleClientIds.iosClientId ||
      googleClientIds.androidClientId ||
      googleClientIds.webClientId ||
      googleClientIds.expoClientId
  );
}
