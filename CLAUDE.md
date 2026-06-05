# CLAUDE.md — CapiMax Mobile App (persistent project rules)

> This file is read automatically every Claude Code session. Do not ignore any rule here.
> **Goal:** build a professional React Native + Expo mobile app for the CapiMax investment
> platform that reuses the **exact same backend and the exact same flows** as the existing web
> dashboard — without inventing any endpoint and without any mock/placeholder data.
>
> **Read these companion docs every session too:**
> - **`STATE.md`** — current project state: what's built, what's next, conventions, deferred items. **Start here to get oriented.**
> - **`API_AND_FLOWS.md`** — the API contract (endpoints, flows, entity shapes, open questions §6).
> - **`DESIGN.md`** — the design language (Stake-style, palettes, component library, motion).

---

## 0) Golden Rules — read before writing a single line

1. **You own the analysis.** The existing web project (`CapiMaxDashboardPanel`) is the single
   source of truth. Read it thoroughly and discover everything yourself: every screen, every
   flow, every API endpoint, every request payload and response shape. Do not rely on anyone's
   summary — derive it from the code.
2. **Never invent endpoints.** Every API call must exist in the web codebase. If something seems
   missing, **ask the owner first** — do not guess a URL or a payload.
3. **No mock / placeholder / fake data anywhere.** Every screen is fed by the real API. If data
   isn't available yet, show a real Loading / Empty / Error state — never fabricate numbers.
4. **Same flows, exactly.** Investment step order (create → pay → sign contract → complete), the
   90-day holding-period logic in the internal market, document-verification logic, fee
   calculation — all must match the web behavior precisely.
5. **Work in phases.** Follow `BUILD_PLAN.md` in order. Do not build all screens at once.
   Each phase: build → test against the real backend → commit.
6. **Commit after every phase** with a clear message. Never leave the project in a non-working state.
7. **Never break RTL.** The app is Arabic/English. Every screen must work in both directions.
8. **Quality over speed.** Loading + Empty + Error states on every screen. No screen ships without them.
9. **Never store tokens in AsyncStorage.** Use `expo-secure-store` for access/refresh tokens.
10. Before declaring a phase "done", verify it against its Definition of Done in `BUILD_PLAN.md`.

---

## 1) Phase 0 deliverable: you produce the API/flows inventory

In Phase 0 you will analyze the web project and **generate `API_AND_FLOWS.md` yourself** in the
repo root. It must contain:
- Every screen in the web app and its route.
- Every API endpoint (method, path, auth required?, request payload, response shape).
- The exact multi-step flows (auth, investment, internal-market sell, withdraw, profile).
- Key data-entity shapes (opportunity, user/profile, wallet summary, investment group, holding…).

From Phase 1 onward, `API_AND_FLOWS.md` (your own analysis) becomes the contract you build against.
Keep it updated if you discover anything new. **Never call an endpoint that isn't in it.**

---

## 2) Backend

- Base URL (production): `https://api.capimaxinvestment.com/` — find/confirm it from the web env
  config (`.env`, `.env.production`, `vite.config.js`).
- Django REST Framework. List responses are typically paginated: `{ count, next, previous, results }`.
- **Auth response envelope:** confirm the exact shape from the web login code — tokens are nested
  (the web reads `response.data.data.access` / `.refresh` / `.is_verified` / `.email`). Match it.
- Put the base URL in env via `app.json > expo.extra.apiUrl` (read with `expo-constants`).
  **Never** hardcode it inside components.

---

## 3) Stack decisions (fixed — don't change without approval)

| Area | Decision | Why |
|---|---|---|
| Framework | Expo (**SDK 54**) + React Native 0.81 + React 19.1 (New Arch on) | fastest path to a polished iOS+Android app |
| Navigation | **expo-router** (file-based) | mirrors web routes, easy deep linking |
| HTTP | single **axios** instance with interceptors | reuse the web's `src/api/api.js` logic |
| Token storage | **expo-secure-store** | secure replacement for localStorage |
| Preferences (language…) | `@react-native-async-storage/async-storage` | non-sensitive |
| i18n | **react-i18next + i18next** | same lib as web; reuse the translation files |
| RTL | `I18nManager` + per-component handling | full Arabic support |
| Charts | **`react-native-svg` custom** (`PerformanceChart`, `Sparkline`) — gifted-charts removed (React-19 peer conflict + not in Expo Go) | Portfolio/Home |
| Downloads | `expo-file-system` (legacy API) + `expo-sharing` | save contract/document PDFs |
| Biometric (next) | `expo-local-authentication` | local convenience unlock only |
| File upload | `expo-image-picker` + `expo-document-picker` | passport_scan upload |
| Contracts / payment WebView | `react-native-webview` | render contract HTML + checkout |
| Contract signing | signature pad inside WebView → base64 image | matches web signing flow |
| Payments (PayPal/Crypto) | see "Payments on mobile" below | web SDKs don't run as-is |

---

## 4) Target folder structure

```
app/                       # expo-router (file-based)
  _layout.jsx              # Providers (Theme, Language, Auth, SafeArea) + auth gate
  index.jsx                # entry gate: authed → /(tabs)/home · else → /onboarding
  onboarding.jsx           # 9 pre-login slides (every launch before login)
  (auth)/ _layout.jsx, login, register, verify, forgot-password, reset-password
  (tabs)/ _layout.jsx — order: Home, Assets(funds), Holdings(myfunds), Portfolio, Market, More
          home, funds, myfunds, portfolio, market, more   # Home is the default tab; NO wallet tab
  wallet.jsx               # pushed screen (was a tab) — opened from Home header + More
  opportunity/[id].jsx
  invest/[id].jsx · market/buy/[listingId].jsx
  account, edit-profile, change-password, contact, faq, document-center, platforms
  legal/[type].jsx         # terms-conditions | statement | policy-insurance
  > Full, current file map lives in STATE.md §2 (+ §1b for onboarding/home/tabs).
src/
  api/client.js            # axios instance + interceptors
  api/services.js          # all API calls grouped by domain
  context/AuthContext.jsx  # session, tokens, login/logout/refresh
  context/LanguageContext.jsx
  theme/colors.js
  i18n/index.js
  locales/en.json, ar.json # copy from web: public/locales/{en,ar}/translation.json
  components/              # shared UI: Screen, Card, Button, StatBox, Chip, Field, EmptyState…
  hooks/                   # useApi, useAuth, useDirection…
```

---

## 5) API client (replicate the web logic)

`src/api/client.js` must mirror the web's `src/api/api.js`:
- Adds `Accept-Language` header based on current language.
- Public endpoints (no token): register, token, verify-email, resend-verification, opportunities
  (list + single), categories. Everything else attaches `Authorization: Bearer <access>`.
- Response interceptor: on 401/403 for a **non-public** endpoint → clear tokens and redirect to
  login (via AuthContext, not `window.location`).
- Token comes from `SecureStore.getItemAsync('access')`.
- Implement refresh-token logic via `/api/token/refresh/` before forcing logout when possible.

---

## 6) Translating web patterns → mobile (important)

| Web | Mobile |
|---|---|
| `localStorage.getItem('access')` | `await SecureStore.getItemAsync('access')` |
| `window.location.href='/auth/login'` | `router.replace('/(auth)/login')` via AuthContext |
| `localStorage.setItem('redirectUrl', …)` | keep intended route in state, return to it after login |
| `<img src={cover_image_url}>` | `<Image source={{uri: cover_image_url}}>` |
| MUI Dialog | React Native Modal / bottom sheet |
| MUI Tabs | simple stateful tab bar |
| react-apexcharts | victory-native / gifted-charts |
| Google `<GoogleLogin>` | `expo-auth-session` Google → send `idToken` as `credential` to `/api/auth/google/` |
| PayPal JS SDK | WebView hosting PayPal SDK, or open checkout via `expo-web-browser` (see §7) |
| file input (passport) | `expo-image-picker` → FormData `{ uri, name, type }` |
| render/sign contract HTML | `react-native-webview` (render `contract_html` + signature pad) |

---

## 7) Payments on mobile (sensitive area)

Same backend endpoints, different UI surface:
- **PayPal:** a WebView screen loading a small HTML page with the PayPal JS SDK (same client id as
  web). On capture success, `window.ReactNativeWebView.postMessage(...)` to return the
  `transaction_id`, then continue the same web flow (contract creation).
- **Crypto / NOWPayments:** call the create-invoice endpoint, open the invoice URL in
  WebView / `expo-web-browser`, then poll the status endpoint until completion.
- **Bank Transfer:** form + receipt upload via the same endpoint the web uses.
- After any successful payment: same contract flow → create contract → fetch contract → sign.

> If any native key/config is missing (PayPal client id, Google OAuth iOS/Android client ids),
> **ask the owner** — never silently skip the feature.

---

## 8) i18n / RTL

- Translation files copied from the web live in `src/locales/{en,ar}.json`. Reuse existing keys
  (`sidebar.*`, `common.*`, `form.*`, `verifyEmail.*`, `opportunity.*`, `wallet.*`, …). New keys
  added this project: `tabs.*` (short tab labels) and a few `opportunity.*` badge labels — always
  add to **both** files.
- **RTL is implemented in `src/context/LanguageContext.jsx` (working, verified on device):**
  - **English = LTR always, Arabic = RTL always** — including after login and after any reload.
  - `I18nManager.forceRTL` only takes effect after a full app reload, so we **reconcile** the native
    RTL flag with the saved language at boot AND on change: `en` → force LTR, `ar` → force RTL.
  - On a direction mismatch (native `isRTL` ≠ language) we do a **one-time full reload** via
    `expo-updates` `reloadAsync()` (dev fallback `DevSettings.reload()`), guarded by a persisted
    `app.rtl.reloadGuard` so it can never reload-loop.
  - The saved language is read **before first layout** (render gated by `isReady`) so we never render
    one direction then flip. Components also mirror via the language-derived `isRTL` from `useLanguage()`.
  - **Do NOT** call `forceRTL` ad-hoc elsewhere or change this flow without re-verifying both
    directions across login + cold start. Directional icons/arrows (chevrons) flip via `isRTL`;
    numbers stay LTR.

---

## 9) Theme tokens — light (Stake-style) + dark (navy + green)

> Full design language in **DESIGN.md** (read it alongside this file). This section is the
> color source-of-truth summary.

**Source of truth:** `src/theme/palettes.js` (two palettes, IDENTICAL token names) + design tokens
in `src/theme/tokens.js` (spacing, radii, type, motion, elevation), all exposed via
`src/context/ThemeContext.jsx` → `useTheme()`. **Every component reads colors/spacing/type/elevation
from `useTheme()` — never a static import.** Mode: `auto` (follow OS via Appearance) | `light` |
`dark`, persisted in AsyncStorage (`app.themeMode`), live re-render (no reload). StatusBar + native
background flip with the mode.

**RULE #4 (contrast):** text/icons on a `primary` (#2ead6f) fill are **always** `onPrimary`
(`#0b2928`) in BOTH modes — never white. (For an `error`/red fill, use white for contrast.)

**DARK palette (navy base + green accent — brand identity):**
```
bg #121c30 · surface #1a2942 · surfaceAlt #223457 · card #18243c
border rgba(255,255,255,.10) · borderStrong rgba(255,255,255,.18)
primary #2ead6f · primaryLight #54c98a · primaryDark #1f8a54 · onPrimary #0b2928
text #FFFFFF · textSecondary #9fb0c9 · textMuted #6b7a93
positive #3ddb86 · negative #ff6b6b · warning #FFA726 · error #f44336 · info #2196F3
gradient brand: [#2ead6f → #1f8a54]
```

**LIGHT palette (Stake-style, primary experience):**
```
bg #F4F7F5 · surface #FFFFFF · surfaceAlt #EEF3F0 · card #FFFFFF
border rgba(11,41,40,.08) · borderStrong rgba(11,41,40,.14)
primary #2ead6f · primaryLight #54c98a · primaryDark #1f8a54 · onPrimary #0b2928
text #0b2928 · textSecondary #5a7a72 · textMuted #93aaa3
positive #1f9d5f · negative #d64545 · warning #E08600 · error #d32f2f · info #1976D2
gradient brand: [#2ead6f → #1f8a54]
```
**Elevation (DESIGN.md §3):** light = soft shadow; dark = raised surface + hairline border (no
shadow). Flat fills — depth from elevation, not gradients (except the one brand gradient for
hero/CTA). Radii: card 20 · button/input 14 · pill 999 · sheet 28 · badge 8. Splash/adaptive-icon
background `#121c30`.

---

## 10) Definition of Done (per screen)

- [ ] Fed by a real endpoint from `API_AND_FLOWS.md` (zero mock).
- [ ] Has Loading + Empty + Error states.
- [ ] Works in Arabic (RTL) and English.
- [ ] Every field shown in the web version is present (no missing data).
- [ ] Matches the theme (colors / spacing / typography).
- [ ] Action buttons execute the same flow as web (same order/conditions).
- [ ] No console warnings/errors, and no `undefined` shown to the user.

---

## 11) Out of scope (unless asked)

- **Admin** screens (`/api/admin/...`, portfolio settings/overrides, fee management).
  This app is for the end investor.

If you need any decision beyond this file, **ask the owner** before proceeding.
