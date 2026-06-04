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

// Host of the API origin (e.g. "api.capimaxinvestment.com") — same-origin doc URLs are authed.
const API_HOST = (() => { try { return baseURL.replace(/^https?:\/\//, "").split("/")[0]; } catch { return ""; } })();
const hostOf = (url = "") => url.replace(/^https?:\/\//, "").split("/")[0];

async function shareFile(uri, mimeType, dialogTitle) {
  const available = await Sharing.isAvailableAsync();
  if (!available) throw dlError("noshare", "Sharing is not available on this device");
  await Sharing.shareAsync(uri, { mimeType: mimeType || "application/pdf", dialogTitle, UTI: UTI_FOR[mimeType] });
}

function isDriveLink(url = "") {
  return /drive\.google\.com/i.test(url);
}

// Extract the FILE_ID from a Drive link: /file/d/<ID>/..., ?id=<ID>, /open?id=<ID>.
function extractDriveId(url = "") {
  let m = url.match(/\/file\/d\/([^/?#]+)/);
  if (m) return m[1];
  m = url.match(/[?&]id=([^&]+)/);
  if (m) return m[1];
  return null;
}

async function openExternally(url) {
  await WebBrowser.openBrowserAsync(url);
  return { mode: "opened" };
}

function mapStatus(res) {
  if (res.status === 401 || res.status === 403) throw dlError("expired");
  if (res.status === 404) throw dlError("notfound");
  if (res.status === 400) throw dlError("notsigned");
  if (res.status >= 400) throw dlError("failed");
}

// Download an authed URL to `dest`, sending the Bearer token; on 401 refresh once + retry
// (mirrors the axios interceptor). Returns the FileSystem download result (with `.status`).
async function authedDownload(url, dest) {
  const auth = (tk) => ({ headers: { Authorization: `Bearer ${tk}` } });
  const token = await getAccessToken();
  if (!token) throw dlError("expired", "Not authenticated");
  let res;
  try {
    res = await FileSystem.downloadAsync(url, dest, auth(token));
  } catch (e) {
    throw dlError("failed", e?.message);
  }
  if (res.status === 401 || res.status === 403) {
    const newTok = await refreshAccessToken();
    if (newTok) {
      try { res = await FileSystem.downloadAsync(url, dest, auth(newTok)); }
      catch (e) { throw dlError("failed", e?.message); }
    }
  }
  return res;
}

// Auth-protected blob (signed contract). `path` begins with /api/...
export async function downloadAuthedAndShare({ path, fileName, mimeType = "application/pdf" }) {
  if (!baseURL) throw dlError("failed", "Missing API base URL");
  const dest = FileSystem.cacheDirectory + ensureExt(sanitize(fileName), mimeType);
  const res = await authedDownload(baseURL + path, dest);
  mapStatus(res);
  await shareFile(res.uri, mimeType, fileName);
  return { mode: "shared" };
}

// Document URL — AUTO-DETECTS the right path (the live /api/documents/ is empty on the test
// account, so all cases are handled defensively):
//   • Google-Drive viewer link → open externally (view-only, not fetchable).
//   • Same API origin (api.capimaxinvestment.com) or a relative "/..." path → auth-protected
//     media → Bearer download → cache → share/save sheet.
//   • Any other absolute URL → public direct file → fetch + share; fall back to external open.
export async function downloadUrlAndShare({ url, fileName, mimeType }) {
  if (!url) throw dlError("failed", "No document URL");
  if (isDriveLink(url)) return openExternally(url);

  const isRelative = url.startsWith("/");
  const sameApiOrigin = isRelative || (API_HOST && hostOf(url) === API_HOST);
  const fullUrl = isRelative ? baseURL + url : url; // baseURL has no trailing slash; url keeps its leading "/"

  const mime = mimeType || mimeFromName(url) || mimeFromName(fileName) || "application/pdf";
  const dest = FileSystem.cacheDirectory + ensureExt(sanitize(fileName), mime);

  // Auth-protected (same origin / relative) → Bearer download with full status mapping.
  if (sameApiOrigin) {
    const res = await authedDownload(fullUrl, dest);
    mapStatus(res);
    await shareFile(res.uri, mime, fileName);
    return { mode: "shared" };
  }

  // Public direct file → fetch without auth; any failure → open externally.
  let res;
  try {
    res = await FileSystem.downloadAsync(fullUrl, dest);
  } catch (e) {
    return openExternally(fullUrl);
  }
  if (res.status >= 400) return openExternally(fullUrl);

  await shareFile(res.uri, mime, fileName);
  return { mode: "shared" };
}

// A document LINK that may be a Google-Drive VIEWER URL (drive.google.com/file/d/<ID>/view).
// Drive viewer links aren't directly fetchable, so we convert to the direct-download URL
// (uc?export=download&id=<ID>) and fetch THAT. If Drive returns its HTML confirmation /
// virus-scan interstitial (large files) — detected via a text/html content-type or a 4xx —
// we fall back to opening the original link externally (the "Preview" behaviour). Non-Drive
// URLs reuse downloadUrlAndShare (same-origin auth / public file). Returns { mode } where
// mode === 'opened' means we fell back to an external open (tell the user).
export async function downloadDocumentLink({ url, fileName, mimeType }) {
  if (!url) throw dlError("failed", "No document URL");

  if (isDriveLink(url)) {
    const id = extractDriveId(url);
    if (!id) return openExternally(url); // unknown Drive shape → just open it
    const directUrl = `https://drive.google.com/uc?export=download&id=${id}`;
    const mime = mimeType || mimeFromName(fileName) || "application/pdf";
    const dest = FileSystem.cacheDirectory + ensureExt(sanitize(fileName), mime);
    let res;
    try {
      res = await FileSystem.downloadAsync(directUrl, dest);
    } catch (e) {
      return openExternally(url); // network/redirect failure → view it instead
    }
    const ct = String(res.headers?.["content-type"] || res.headers?.["Content-Type"] || "").toLowerCase();
    // Got the HTML interstitial instead of the file (large file / scan page) → fall back.
    if (res.status >= 400 || ct.includes("text/html")) return openExternally(url);
    await shareFile(res.uri, mime, fileName);
    return { mode: "shared" };
  }

  // Not a Drive link → same-origin auth / public file (reuse existing logic, no duplication).
  return downloadUrlAndShare({ url, fileName, mimeType });
}
