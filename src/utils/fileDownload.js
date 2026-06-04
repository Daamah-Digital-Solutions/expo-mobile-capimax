// File download + share helpers (Phase 10).
// Two paths, both end in the OS share/save sheet (expo-sharing):
//   • downloadAuthedAndShare — for auth-protected blobs (signed contract PDFs). Sends the
//     Bearer token via the download request headers; on 401 refreshes once and retries.
//   • downloadUrlAndShare    — for public document URLs. Direct files are fetched + shared;
//     Google-Drive viewer links (not directly fetchable) fall back to opening externally.
// Uses the expo-file-system LEGACY API (downloadAsync returns the HTTP status, which we need
// to distinguish 401/404/400 — the new File API does not surface it).
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { getAccessToken } from "../api/tokenStorage";
import { refreshAccessToken } from "../api/client";

const baseURL = (Constants.expoConfig?.extra?.apiUrl || "").replace(/\/$/, "");

// Typed error with a `.code` the UI maps to a message.
function dlError(code, message) {
  const e = new Error(message || code);
  e.code = code;
  return e;
}

function sanitize(name, fallback = "document") {
  const n = String(name || fallback).replace(/[\/\\?%*:|"<>]/g, "_").replace(/\s+/g, "_").trim();
  return n || fallback;
}

function mimeFromName(name = "") {
  const ext = name.split("?")[0].split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return null;
}

function ensureExt(name, mime) {
  if (/\.[a-z0-9]{2,5}$/i.test(name)) return name;
  if (mime === "image/png") return name + ".png";
  if (mime === "image/jpeg") return name + ".jpg";
  return name + ".pdf";
}

const UTI_FOR = { "application/pdf": "com.adobe.pdf", "image/png": "public.png", "image/jpeg": "public.jpeg" };

async function shareFile(uri, mimeType, dialogTitle) {
  const available = await Sharing.isAvailableAsync();
  if (!available) throw dlError("noshare", "Sharing is not available on this device");
  await Sharing.shareAsync(uri, { mimeType: mimeType || "application/pdf", dialogTitle, UTI: UTI_FOR[mimeType] });
}

function isDriveLink(url = "") {
  return /drive\.google\.com/i.test(url);
}

async function openExternally(url) {
  await WebBrowser.openBrowserAsync(url);
  return { mode: "opened" };
}

// Auth-protected blob (signed contract). `path` begins with /api/...
export async function downloadAuthedAndShare({ path, fileName, mimeType = "application/pdf" }) {
  if (!baseURL) throw dlError("failed", "Missing API base URL");
  const url = baseURL + path;
  const dest = FileSystem.cacheDirectory + ensureExt(sanitize(fileName), mimeType);
  const auth = (tk) => ({ headers: { Authorization: `Bearer ${tk}` } });

  const token = await getAccessToken();
  if (!token) throw dlError("expired", "Not authenticated");

  let res;
  try {
    res = await FileSystem.downloadAsync(url, dest, auth(token));
  } catch (e) {
    throw dlError("failed", e?.message);
  }
  // Expired access → refresh once + retry (mirrors the axios interceptor).
  if (res.status === 401 || res.status === 403) {
    const newTok = await refreshAccessToken();
    if (newTok) {
      try { res = await FileSystem.downloadAsync(url, dest, auth(newTok)); }
      catch (e) { throw dlError("failed", e?.message); }
    }
  }
  if (res.status === 401 || res.status === 403) throw dlError("expired");
  if (res.status === 404) throw dlError("notfound");
  if (res.status === 400) throw dlError("notsigned");
  if (res.status >= 400) throw dlError("failed");

  await shareFile(res.uri, mimeType, fileName);
  return { mode: "shared" };
}

// Public document URL. Drive viewer links → open externally; direct files → fetch + share.
export async function downloadUrlAndShare({ url, fileName, mimeType }) {
  if (!url) throw dlError("failed", "No document URL");
  if (isDriveLink(url)) return openExternally(url);

  const mime = mimeType || mimeFromName(url) || mimeFromName(fileName) || "application/pdf";
  const dest = FileSystem.cacheDirectory + ensureExt(sanitize(fileName), mime);

  let res;
  try {
    res = await FileSystem.downloadAsync(url, dest);
  } catch (e) {
    // Not directly fetchable (scheme/CORS/redirect) → open externally instead.
    return openExternally(url);
  }
  if (res.status >= 400) return openExternally(url);

  await shareFile(res.uri, mime, fileName);
  return { mode: "shared" };
}
