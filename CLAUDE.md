# CLAUDE.md — CapiMax Mobile App (persistent project rules)

> This file is read automatically every Claude Code session. Do not ignore any rule here.
> **Goal:** build a professional React Native + Expo mobile app for the CapiMax investment
> platform that reuses the **exact same backend and the exact same flows** as the existing web
> dashboard — without inventing any endpoint and without any mock/placeholder data.

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
| Framework | Expo (SDK 51) + React Native | fastest path to a polished iOS+Android app |
| Navigation | **expo-router** (file-based) | mirrors web routes, easy deep linking |
| HTTP | single **axios** instance with interceptors | reuse the web's `src/api/api.js` logic |
| Token storage | **expo-secure-store** | secure replacement for localStorage |
| Preferences (language…) | `@react-native-async-storage/async-storage` | non-sensitive |
| i18n | **react-i18next + i18next** | same lib as web; reuse the translation files |
| RTL | `I18nManager` + per-component handling | full Arabic support |
| Charts | `victory-native` or `react-native-gifted-charts` | Portfolio/Funds |
| File upload | `expo-image-picker` + `expo-document-picker` | passport_scan upload |
| Contracts / payment WebView | `react-native-webview` | render contract HTML + checkout |
| Contract signing | signature pad inside WebView → base64 image | matches web signing flow |
| Payments (PayPal/Crypto) | see "Payments on mobile" below | web SDKs don't run as-is |

---

## 4) Target folder structure

```
app/                       # expo-router (file-based)
  _layout.jsx              # Providers (Auth, i18n, SafeArea) + auth gate
  index.jsx                # redirect → /(tabs)/funds or /(auth)/login
  (auth)/ _layout.jsx, login, register, verify, forgot-password, reset-password
  (tabs)/ _layout.jsx (Funds, MyFunds, Wallet, Portfolio, Market, More)
          funds, myfunds, wallet, portfolio, market, more
  opportunity/[id].jsx
  invest/[id].jsx
  account, edit-profile, change-password, contact, faq, document-center
  legal/[type].jsx         # terms | privacy | terms-conditions
  payment-success.jsx
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

- Copy the two translation files from the web (`public/locales/en/translation.json`,
  `public/locales/ar/translation.json`) into `src/locales/`.
- Reuse the existing translation keys (sidebar.*, wallet.*, account.*, investForm.*,
  internalMarket.* …). Don't invent new keys unless necessary, and add them to both files.
- When switching to Arabic, enable RTL (`I18nManager.forceRTL(true)`) and reload if needed.
  Ensure directional icons/arrows flip.

---

## 9) Theme tokens — light + dark (teal/green brand)

**Source of truth:** `src/theme/palettes.js` (two palettes, IDENTICAL token names) exposed via
`src/context/ThemeContext.jsx`. **Every component reads colors from `useTheme().theme` — never
a static color import.** Mode: `auto` (follow OS via Appearance) | `light` | `dark`, persisted in
AsyncStorage (`app.themeMode`), live re-render on change (no reload). StatusBar + native
background flip with the mode.

**RULE #4 (contrast):** text/icons on a `primary` (#2ead6f) fill are **always** `onPrimary`
(`#0b2928`) in BOTH modes — never white. Use `theme.onPrimary`. (For an `error`/red fill, use
white for contrast.)

**DARK palette (teal/green):**
```
bg #0b2928 · surface #103634 · surfaceAlt #14403d · card #0f312f
border rgba(255,255,255,.10) · borderStrong rgba(255,255,255,.18)
primary #2ead6f · primaryLight #54c98a · primaryDark #1f8a54 · onPrimary #0b2928
text #FFFFFF · textSecondary #9bbab2 · textMuted #6f8d86
success #2ead6f · warning #FFA726 · error #f44336 · info #2196F3
gradient brand: [#2ead6f → #54c98a] · gradient card: [#14403d → #0b2928 → #14403d]
```

**LIGHT palette (teal/green):**
```
bg #F2F7F4 · surface #FFFFFF · surfaceAlt #E8F1EC · card #FFFFFF
border rgba(11,41,40,.10) · borderStrong rgba(11,41,40,.18)
primary #2ead6f · primaryLight #54c98a · primaryDark #1f8a54 · onPrimary #0b2928
text #0b2928 · textSecondary #4f6f67 · textMuted #7d9a92
success #1f9d5f · warning #E08600 · error #d32f2f · info #1976D2
gradient brand: [#2ead6f → #54c98a] · gradient card: [#FFFFFF → #F2F7F4 → #FFFFFF]
```
Cards: gradient `card` bg (135deg) + subtle border + 12–16 radius (`radius.card` = 14).
Keep a premium feel (soft shadows, comfortable spacing) in BOTH modes.

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
