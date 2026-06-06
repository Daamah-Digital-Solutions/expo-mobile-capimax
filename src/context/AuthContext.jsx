// AuthContext — session state, login/logout/refresh, tokens in SecureStore.
// Implements the exact login flow from API_AND_FLOWS.md Flow A:
//   - token envelope is per-endpoint (login/google → data.data.access; verify → data.token).
//   - is_verified === false (or error "Account not verified") routes to verification.
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authService } from "../api/services";
import { setUnauthorizedHandler, refreshAccessToken } from "../api/client";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "../api/tokenStorage";
import {
  isBiometricEnabled,
  setBiometricEnabledFlag,
  getBiometricCapability,
  runBiometricAuth,
  wasBiometricAsked,
  markBiometricAsked,
  clearBiometricAsked,
} from "../utils/biometrics";

const AuthContext = createContext(null);

// Decode a JWT payload and read `exp` (seconds). Returns true if expired/undecodable.
function isAccessTokenExpired(token) {
  try {
    const payload = token.split(".")[1];
    // base64url → base64
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(global.atob(normalized));
    if (!json.exp) return false;
    return json.exp < Date.now() / 1000;
  } catch (e) {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  // Onboarding-before-auth gate. In-memory only → resets every launch, so a logged-out (or
  // locked) user sees onboarding on EVERY launch before reaching the login/register screens.
  // Set true when the user finishes/skips onboarding; authenticated users never see it.
  const [onboardingDone, setOnboardingDone] = useState(false);

  // Biometric quick-unlock (local convenience lock over the secure-store session).
  // isLocked: a valid session exists but is gated behind the device biometric prompt.
  // biometricEnabled: the user's saved preference. biometric: device capability probe.
  const [isLocked, setIsLocked] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometric, setBiometric] = useState({ available: false, kind: "generic", hasHardware: false });
  // One-time, post-first-login "enable biometrics?" offer (full-screen branded overlay, not a Alert).
  const [biometricSetupVisible, setBiometricSetupVisible] = useState(false);

  // The intended route to return to after a forced login (Flow A "return to route").
  const [pendingRoute, setPendingRoute] = useState(null);

  // FULL sign-out / switch-account: wipe the stored session AND the biometric prefs (enabled +
  // "asked"), so the device no longer holds this account and the next user is re-offered enrollment.
  // This is the security exit (lost/sold phone, switching accounts) — distinct from lockApp().
  const signOut = useCallback(async () => {
    await clearTokens();
    await setBiometricEnabledFlag(false);
    await clearBiometricAsked();
    setBiometricEnabled(false);
    setIsAuthenticated(false);
    setUserEmail(null);
    setIsLocked(false);
  }, []);

  // LOCK (bank-style): clear the in-memory auth but KEEP the stored session in secure-store, so
  // biometrics can reopen it. The gate routes to the Login screen, which shows the biometric button.
  const lockApp = useCallback(() => {
    setIsAuthenticated(false);
    setIsLocked(true);
  }, []);

  // Let the axios interceptor flip our state when a refresh ultimately fails.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setIsAuthenticated(false);
      setUserEmail(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Bootstrap session on mount.
  useEffect(() => {
    (async () => {
      try {
        // Probe biometric capability + saved preference once (drives the lock + Settings toggle).
        const [cap, enabledPref] = await Promise.all([
          getBiometricCapability(),
          isBiometricEnabled(),
        ]);
        setBiometric(cap);
        // If hardware/enrollment vanished (user removed it in OS settings), silently
        // treat biometrics as off so we never lock the user out.
        const effectiveEnabled = enabledPref && cap.available;
        setBiometricEnabled(effectiveEnabled);

        const access = await getAccessToken();
        if (!access) {
          setIsAuthenticated(false);
          return;
        }

        let hasSession = false;
        if (!isAccessTokenExpired(access)) {
          hasSession = true;
        } else {
          // expired → try a refresh before giving up
          const refresh = await getRefreshToken();
          if (refresh) {
            const newAccess = await refreshAccessToken(refresh);
            if (newAccess) hasSession = true;
          }
        }

        if (!hasSession) {
          await clearTokens();
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);
        // A valid session AND biometric enabled AND device still enrolled → lock the app
        // behind the biometric prompt until the user passes it.
        if (effectiveEnabled) setIsLocked(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // After a fresh sign-in, offer to enable biometric quick-unlock — once, via the branded
  // full-screen overlay (no system Alert). Skips silently if the device can't do it, if it's
  // already enabled, or if we've already asked.
  const maybeOfferBiometricSetup = useCallback(async () => {
    try {
      const cap = await getBiometricCapability();
      setBiometric(cap);
      if (!cap.available) return;
      if (await isBiometricEnabled()) return;
      if (await wasBiometricAsked()) return;
      setBiometricSetupVisible(true);
    } catch {
      /* non-fatal */
    }
  }, []);

  // Persist tokens + flip auth on. Used by login, google, and verify-email (Phase 2).
  // A fresh successful auth always clears any biometric lock (the user just proved identity),
  // and triggers the one-time "enable biometrics?" offer.
  const applyTokens = useCallback(
    async ({ access, refresh, email }) => {
      await setTokens({ access, refresh });
      if (email) setUserEmail(email);
      setIsAuthenticated(true);
      setIsLocked(false);
      maybeOfferBiometricSetup();
    },
    [maybeOfferBiometricSetup]
  );

  // Flow A. Returns one of:
  //   { status: 'success' }
  //   { status: 'unverified', email }
  //   { status: 'error', message }
  const signIn = useCallback(
    async ({ email, password }) => {
      try {
        const res = await authService.login({ email, password });
        const data = res?.data;
        const inner = data?.data;

        if (inner?.is_verified === false || data?.error === "Account not verified") {
          return { status: "unverified", email: inner?.email || email };
        }
        const access = inner?.access || data?.access; // contract: data.data.access (fallback to top-level)
        if (access) {
          await applyTokens({ access, refresh: inner?.refresh || data?.refresh, email: inner?.email || email });
          return { status: "success" };
        }
        return { status: "error", message: data?.message || data?.error || "Login failed" };
      } catch (err) {
        // Live backend returns 401 {status:"error", code, message} for bad creds (public
        // endpoint → no forced logout). The unverified case may also arrive as an error envelope.
        const apiErr = err?.response?.data;
        const code = apiErr?.code;
        const msg = apiErr?.message || apiErr?.error || apiErr?.detail;
        if (apiErr?.error === "Account not verified" || code === "account_not_verified" || /not\s*verified/i.test(msg || "")) {
          return { status: "unverified", email };
        }
        return { status: "error", message: msg || err.message };
      }
    },
    [applyTokens]
  );

  // Google sign-in (live): POST /api/auth/google/ { credential: <Google ID token JWT> }.
  // Success 200 → data.data.{ access, refresh, email, username, name, is_new_user }. Store tokens
  // like a normal login (applyTokens also fires the biometric enroll offer). Errors 400 → { error }.
  const signInWithGoogle = useCallback(
    async (credential) => {
      try {
        const res = await authService.google(credential);
        // TEMPORARY DEBUG: log the backend response shape.
        console.log("[auth/google][DEBUG] status:", res?.status, "| body:", JSON.stringify(res?.data));
        const inner = res?.data?.data;
        if (inner?.access) {
          await applyTokens({ access: inner.access, refresh: inner.refresh, email: inner.email });
          return { status: "success", isNewUser: !!inner.is_new_user };
        }
        return { status: "error", message: res?.data?.error || res?.data?.message || "Invalid response from server" };
      } catch (err) {
        const apiErr = err?.response?.data;
        // TEMPORARY DEBUG: log the rejection status + body.
        console.log("[auth/google][DEBUG] rejected status:", err?.response?.status, "| body:", JSON.stringify(apiErr), "| err:", err?.message);
        // Backend uses the `error` field for the Google flow (e.g. "Wrong issuer.",
        // "Invalid or unverified email", "Google credential is required").
        return { status: "error", message: apiErr?.error || apiErr?.message || err.message };
      }
    },
    [applyTokens]
  );

  // Re-probe device capability (e.g. when opening Settings). Returns the fresh capability.
  const refreshBiometricCapability = useCallback(async () => {
    const cap = await getBiometricCapability();
    setBiometric(cap);
    return cap;
  }, []);

  // Run the OS biometric prompt to lift the lock. Returns the raw result ({ success, error }).
  // On success we clear the lock AND restore the in-memory auth (the stored session is valid —
  // lockApp only cleared the in-memory flag).
  const unlock = useCallback(async ({ promptMessage, cancelLabel }) => {
    const res = await runBiometricAuth({ promptMessage, cancelLabel });
    if (res?.success) {
      setIsLocked(false);
      setIsAuthenticated(true);
    }
    return res;
  }, []);

  // Enable the local biometric lock. Verifies the sensor works first (one prompt), then
  // persists the preference. Returns { success, error? }. No password is ever stored.
  const enableBiometric = useCallback(async ({ promptMessage, cancelLabel }) => {
    const cap = await getBiometricCapability();
    setBiometric(cap);
    if (!cap.available) return { success: false, error: "not_available" };
    const res = await runBiometricAuth({ promptMessage, cancelLabel });
    if (res?.success) {
      await setBiometricEnabledFlag(true);
      setBiometricEnabled(true);
    }
    return res;
  }, []);

  const disableBiometric = useCallback(async () => {
    await setBiometricEnabledFlag(false);
    setBiometricEnabled(false);
  }, []);

  // --- One-time biometric setup overlay (post first login) ---
  // Enable from the overlay: run the verify prompt; mark asked + hide regardless of outcome
  // (so we never re-offer; the user can still flip it later in Settings).
  const enableBiometricFromSetup = useCallback(async ({ promptMessage, cancelLabel }) => {
    const res = await enableBiometric({ promptMessage, cancelLabel });
    await markBiometricAsked();
    setBiometricSetupVisible(false);
    return res;
  }, [enableBiometric]);

  const dismissBiometricSetup = useCallback(async () => {
    await markBiometricAsked();
    setBiometricSetupVisible(false);
  }, []);

  // Onboarding finished/skipped this launch → allow the auth screens.
  const completeOnboarding = useCallback(() => setOnboardingDone(true), []);

  const value = {
    isLoading,
    isAuthenticated,
    userEmail,
    pendingRoute,
    setPendingRoute,
    signIn,
    signInWithGoogle,
    signOut, // full sign-out / switch account (clears session + biometric prefs)
    lockApp, // bank-style lock (keeps session for biometric re-entry)
    applyTokens, // verify-email flow (data.token) calls this in Phase 2
    // Biometric quick-unlock
    isLocked,
    biometricEnabled,
    biometric,
    unlock,
    enableBiometric,
    disableBiometric,
    refreshBiometricCapability,
    // One-time post-login setup overlay
    biometricSetupVisible,
    enableBiometricFromSetup,
    dismissBiometricSetup,
    // Onboarding-before-auth gate
    onboardingDone,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export default AuthContext;
