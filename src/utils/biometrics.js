// Biometric quick-unlock helpers (Face ID / Fingerprint).
//
// IMPORTANT: this is a LOCAL convenience lock over the secure-store session — NOT a backend
// auth method. The backend only knows email/password. We never store the raw password; the
// OS biometric gate simply guards re-entry into an already-stored session (tokens live in
// expo-secure-store). If the device has no biometric hardware/enrollment we skip silently so
// the user is never locked out.
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ENABLED_KEY = "app.biometricEnabled"; // "1" | "0"
const ASKED_KEY = "app.biometricAsked"; // "1" once we've offered enrollment after a login

// --- Preference flags (AsyncStorage; safe to lose — it only gates a local convenience) ---
export async function isBiometricEnabled() {
  try {
    return (await AsyncStorage.getItem(ENABLED_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function setBiometricEnabledFlag(value) {
  try {
    await AsyncStorage.setItem(ENABLED_KEY, value ? "1" : "0");
  } catch {
    /* non-fatal */
  }
}

export async function wasBiometricAsked() {
  try {
    return (await AsyncStorage.getItem(ASKED_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function markBiometricAsked() {
  try {
    await AsyncStorage.setItem(ASKED_KEY, "1");
  } catch {
    /* non-fatal */
  }
}

// Clear the "asked" flag — used on a FULL sign-out / switch-account so the next user on this
// device is offered biometric enrollment again.
export async function clearBiometricAsked() {
  try {
    await AsyncStorage.removeItem(ASKED_KEY);
  } catch {
    /* non-fatal */
  }
}

// --- Capability probe ---
// kind: "face" | "fingerprint" | "generic" — used only to pick a label/icon.
export async function getBiometricCapability() {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
    let kind = "generic";
    if (isEnrolled) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) kind = "face";
      else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) kind = "fingerprint";
    }
    return { hasHardware, isEnrolled, available: hasHardware && isEnrolled, kind };
  } catch {
    return { hasHardware: false, isEnrolled: false, available: false, kind: "generic" };
  }
}

// --- The OS biometric gate ---
// Returns the raw LocalAuthentication result: { success, error?, warning? }.
// error is one of: user_cancel, system_cancel, app_cancel, lockout, lockout_permanent,
// not_enrolled, not_available, authentication_failed, ...
export async function runBiometricAuth({ promptMessage, cancelLabel }) {
  try {
    return await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel,
      // Allow the OS device-passcode fallback (still a secure OS gate); the in-app
      // "email & password" path is the explicit user-initiated fallback.
      disableDeviceFallback: false,
    });
  } catch (e) {
    return { success: false, error: "unknown" };
  }
}

// Map a capability kind to the i18n key for its human label (caller does t()).
export function methodLabelKey(kind) {
  if (kind === "face") return "biometric.faceId";
  if (kind === "fingerprint") return "biometric.fingerprint";
  return "biometric.generic";
}
