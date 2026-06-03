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

  // The intended route to return to after a forced login (Flow A "return to route").
  const [pendingRoute, setPendingRoute] = useState(null);

  const signOut = useCallback(async () => {
    await clearTokens();
    setIsAuthenticated(false);
    setUserEmail(null);
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
        const access = await getAccessToken();
        if (!access) {
          setIsAuthenticated(false);
          return;
        }
        if (!isAccessTokenExpired(access)) {
          setIsAuthenticated(true);
          return;
        }
        // expired → try a refresh before giving up
        const refresh = await getRefreshToken();
        if (refresh) {
          const newAccess = await refreshAccessToken(refresh);
          if (newAccess) {
            setIsAuthenticated(true);
            return;
          }
        }
        await clearTokens();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Persist tokens + flip auth on. Used by login, google, and verify-email (Phase 2).
  const applyTokens = useCallback(async ({ access, refresh, email }) => {
    await setTokens({ access, refresh });
    if (email) setUserEmail(email);
    setIsAuthenticated(true);
  }, []);

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
        if (inner?.access) {
          await applyTokens({ access: inner.access, refresh: inner.refresh, email: inner.email || email });
          return { status: "success" };
        }
        return { status: "error", message: data?.error || "Login failed" };
      } catch (err) {
        const apiErr = err?.response?.data;
        if (apiErr?.error === "Account not verified") {
          return { status: "unverified", email };
        }
        return { status: "error", message: apiErr?.error || apiErr?.detail || err.message };
      }
    },
    [applyTokens]
  );

  // Google sign-in: send the Google idToken as `credential`; read data.data.access/refresh.
  const signInWithGoogle = useCallback(
    async (credential) => {
      try {
        const res = await authService.google(credential);
        const inner = res?.data?.data;
        if (inner?.access) {
          await applyTokens({ access: inner.access, refresh: inner.refresh });
          return { status: "success" };
        }
        return { status: "error", message: "Invalid response from server" };
      } catch (err) {
        const apiErr = err?.response?.data;
        return { status: "error", message: apiErr?.message || apiErr?.error || err.message };
      }
    },
    [applyTokens]
  );

  const value = {
    isLoading,
    isAuthenticated,
    userEmail,
    pendingRoute,
    setPendingRoute,
    signIn,
    signInWithGoogle,
    signOut,
    applyTokens, // verify-email flow (data.token) calls this in Phase 2
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export default AuthContext;
