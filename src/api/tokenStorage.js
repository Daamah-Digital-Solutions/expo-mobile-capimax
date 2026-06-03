// Secure token storage — CLAUDE.md §0.9 (NEVER store tokens in AsyncStorage).
// Keys mirror the web (src/api/constants.js): "access" / "refresh".
import * as SecureStore from "expo-secure-store";

export const ACCESS_TOKEN = "access";
export const REFRESH_TOKEN = "refresh";

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN);
}

export async function setAccessToken(access) {
  if (access) await SecureStore.setItemAsync(ACCESS_TOKEN, access);
}

// Persist both tokens. Refresh is optional (some flows only return an access token).
export async function setTokens({ access, refresh }) {
  if (access) await SecureStore.setItemAsync(ACCESS_TOKEN, access);
  if (refresh) await SecureStore.setItemAsync(REFRESH_TOKEN, refresh);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN);
}
