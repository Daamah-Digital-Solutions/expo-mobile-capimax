// Axios instance mirroring the web's src/api/api.js (CLAUDE.md §5), adapted for mobile:
// - baseURL from app.json extra.apiUrl (expo-constants) — never hardcoded.
// - Accept-Language header from the current i18n language.
// - Token read from expo-secure-store (not localStorage).
// - Public endpoints get no Authorization header.
// - On 401/403 for a non-public endpoint: try a token refresh once, retry, then log out
//   via a registered handler (AuthContext) instead of window.location.
import axios from "axios";
import Constants from "expo-constants";
import i18n from "../i18n";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  clearTokens,
} from "./tokenStorage";

const baseURL = Constants.expoConfig?.extra?.apiUrl;

if (!baseURL) {
  // Fail loud in dev — a missing base URL means every request would silently break.
  console.warn("[api] Missing expo.extra.apiUrl in app.json");
}

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Public endpoints (no Authorization header). Mirrors the web's regex list, plus the
// endpoints resolved as public in API_AND_FLOWS.md §6 (#1): google / forgot / reset / refresh.
const PUBLIC_ENDPOINTS = [
  /^\/api\/user\/register\/?$/,
  /^\/api\/user\/token\/?$/,
  /^\/api\/verify-email\/?$/,
  /^\/api\/resend-verification\/?$/,
  /^\/api\/opportunities\/?$/,
  /^\/api\/opportunities\/\d+\/?$/,
  /^\/api\/categories\/?$/,
  /^\/api\/auth\/google\/?$/,
  /^\/api\/forgot-password\/?$/,
  /^\/api\/reset-password\/?$/,
  /^\/api\/token\/refresh\/?$/,
];

export function isPublicEndpoint(url = "") {
  const path = url.split("?")[0]; // ignore query string when matching
  return PUBLIC_ENDPOINTS.some((re) => re.test(path));
}

// --- Logout handler registration (set by AuthContext) ---
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

// --- Token refresh (shared by the interceptor and AuthContext bootstrap) ---
// Uses a bare axios call to the public refresh endpoint to avoid interceptor recursion.
export async function refreshAccessToken(refresh) {
  const token = refresh ?? (await getRefreshToken());
  if (!token) return null;
  try {
    const res = await axios.post(
      `${baseURL}api/token/refresh/`,
      { refresh: token },
      { headers: { "Content-Type": "application/json", "Accept-Language": i18n.language || "en" } }
    );
    const newAccess = res?.data?.access; // OQ#4: refresh → response.data.access
    if (newAccess) {
      await setAccessToken(newAccess);
      return newAccess;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// --- Request interceptor: language + auth header ---
api.interceptors.request.use(async (config) => {
  config.headers["Accept-Language"] = i18n.language || "en";

  if (isPublicEndpoint(config.url)) return config;

  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response interceptor: refresh-and-retry, then logout ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    const status = error?.response?.status;
    const publicEp = isPublicEndpoint(config?.url || "");

    if ((status === 401 || status === 403) && !publicEp && config && !config._retry) {
      config._retry = true;
      const newAccess = await refreshAccessToken();
      if (newAccess) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${newAccess}`;
        return api(config); // retry the original request once
      }
      // Refresh failed → clear tokens and let AuthContext route to login.
      await clearTokens();
      if (onUnauthorized) onUnauthorized();
    }

    return Promise.reject(error);
  }
);

export default api;
