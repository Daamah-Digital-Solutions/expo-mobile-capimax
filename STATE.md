# STATE.md — CapiMax Mobile project state

> **Orientation file. Read first every session**, alongside `CLAUDE.md`, `API_AND_FLOWS.md`, `DESIGN.md`.
> Captures what's built, what's next, conventions, and deferred decisions so a fresh session loses
> no context. Keep this current at the end of each phase.

---

## 1) Phase status

| Phase | Scope | Status |
|---|---|---|
| 0 | Analysis + Expo scaffold + `API_AND_FLOWS.md` | ✅ done |
| 1 | Foundation: API client, services, Auth/Language/Theme contexts, i18n/RTL, nav skeleton | ✅ done |
| 2 | Full auth (login/register/verify/forgot/reset) wired to real backend | ✅ done |
| 3 | Funds list (AssetCard) + Opportunity detail page; Buy routes correctly | ✅ done |
| 4 | 4-step Buy flow on `/invest/[id]`: gate → amount/fee → pay (all 5 methods, LIVE) → sign contract → complete | ✅ done |
| 5 | Wallet (balances/summary + transactions/withdrawals) + Withdraw (Flow G) | ✅ done |
| 6 | MyFunds (My Holdings + sell-status) + Portfolio (svg chart, refresh) | ✅ done |
| 7 | Internal Market: listings/holdings/my-listings/transactions/stats + create-listing (SELL) + purchase (BUY, all 4 methods + contract) | ✅ done |
| 8 | **NEXT** — Account + Edit profile (passport upload) + Change password | ⏳ |
| 9 | Support / FAQ / Legal / Document center / Settings | ⏳ |
| 10 | Polish + QA + EAS build | ⏳ |

Detailed per-phase "Ready prompts" + Definitions of Done are in `BUILD_PLAN.md`.

---

## 2) What's built (file map)

```
app/
  _layout.jsx            providers (Theme→Language→Auth) + auth gate + splash + StatusBar
  index.jsx              redirect → /(tabs)/funds
  (auth)/ login, register, verify, forgot-password, reset-password   (Phase 2, all functional)
  (tabs)/ _layout (TabBar) + funds(real, P3) · wallet(real, P5) · myfunds(real, P6) ·
          portfolio(real, P6) · market(real, P7) · more(settings → P9)
  opportunity/[id].jsx   Opportunity detail (Phase 3)
  invest/[id].jsx        REAL 4-step Buy flow machine (Phase 4): gate→amount→payment→contract→complete
  market/buy/[listingId].jsx  REAL internal-market BUY machine (Phase 7): shares→method→
                         purchase→branch(wallet/bank/PayPal/crypto)→contract→success
  edit-profile.jsx       Phase-8 placeholder (Buy gate routes here when has_passport=false)
src/
  api/ client.js (axios + interceptors + refresh), services.js (all endpoints), tokenStorage.js (SecureStore)
  context/ ThemeContext, LanguageContext, AuthContext
  theme/ palettes.js (dark+light colors), tokens.js (spacing/radii/type/motion/elevation)
  i18n/ index.js          locales/ en.json, ar.json
  components/ AppButton, Card, AssetCard, StatTile, ReturnPill, Chip, Badge, SegmentedControl,
              Field, Banner, AuthCard, SectionHeader, EmptyState, BottomSheet, Skeleton,
              Screen, PlaceholderScreen, GoogleSignInButton
              motion/ PressableScale, FadeInView, AnimatedNumber
              invest/ PaymentStep, PayPalWebView, NowPaymentsWebView, ContractStep, CompleteStep,
                      FilePickerButton, paymentData.js (P4)
              wallet/ WithdrawSheet (P5)
              portfolio/ PerformanceChart (react-native-svg, P6)
              market/ CreateListingSheet (SELL — Flow E, P7)
  auth/ googleConfig.js   utils/ passwordValidation.js, html.js
```

Auth screens use `AppButton/Field/Banner/AuthCard`. Funds uses `AssetCard/Chip/Skeleton/EmptyState`.
Detail uses `Card/Badge/StatTile/AppButton/SectionHeader/Skeleton/EmptyState` + safe HTML render.
Wallet/MyFunds/Portfolio use `Card/Banner/SegmentedControl/AnimatedNumber/EmptyState/Skeleton`
(+ `WithdrawSheet`, `PerformanceChart`). Buy flow lives entirely under `components/invest/`.

---

## 3) Stack & tooling conventions

- **Expo SDK 54** · React Native 0.81 · React 19.1 · expo-router 6 · New Architecture default-on.
- **Validation workflow** (the assistant cannot run a device): after changes, run
  `npx expo export --platform ios --output-dir /tmp/x` (must bundle clean) and `npx expo-doctor`
  (must be **18/18**). The user tests on a real Android device (Expo Go SDK 54).
- **Motion:** `react-native-reanimated` v4 + `react-native-worklets` (both **direct** deps);
  `babel.config.js` includes `react-native-worklets/plugin` (must be last). Respect OS reduce-motion.
- `babel-preset-expo` is a **direct devDependency** (SDK 54 reinstall didn't hoist it → bundle broke).
- `expo-updates` added for `Updates.reloadAsync()` (RTL one-time reload).
- **Removed** `react-native-gifted-charts` + `react-native-linear-gradient` (React-19 peer conflict +
  not in Expo Go). **Phase 6 chart** = custom `src/components/portfolio/PerformanceChart.jsx` built on
  **`react-native-svg`** (already a dep) — no new chart lib; Expo-Go + New-Arch safe. Charts are LTR.
- Tokens in **SecureStore** (`access`/`refresh`); language + theme prefs in **AsyncStorage**
  (`app.language`, `app.themeMode`, `app.rtl.reloadGuard`).
- Backend base URL `https://api.capimaxinvestment.com/` in `app.json` → `extra.apiUrl` (via `expo-constants`).
  PayPal live client id in `extra.paypalClientId`. Google OAuth client ids go in `extra.google.*` (deferred).

---

## 4) Theme system (DESIGN.md is authoritative)

- Two palettes, **identical token names**, in `src/theme/palettes.js`; read via `useTheme().theme`.
  **Never import colors statically.**
  - **DARK = navy + green:** `bg #121c30 · surface #1a2942 · surfaceAlt #223457 · card #18243c ·
    primary #2ead6f · text #FFFFFF · textSecondary #9fb0c9 · textMuted #6b7a93 · positive #3ddb86 ·
    negative #ff6b6b`.
  - **LIGHT = Stake:** `bg #F4F7F5 · surface #FFFFFF · surfaceAlt #EEF3F0 · card #FFFFFF ·
    primary #2ead6f · primaryDark #1f8a54 · text #0b2928 · textSecondary #5a7a72 · positive #1f9d5f ·
    negative #d64545`.
- `src/theme/tokens.js`: `spacing`, `radii` (card 20/button 14/pill 999/sheet 28/badge 8), `type`
  scale (display/h1/h2/statNumber/body/label/caption/micro), `motion`, `makeElevation` — exposed via
  `useTheme()` (`spacing/radii/type/motion/elevation`).
- **Elevation:** light = soft shadow; dark = raised surface + hairline border (no shadow).
- **Rule #4 (hard):** content on a `primary` (#2ead6f) fill is ALWAYS `onPrimary` (#0b2928), never
  white. (On a red/error fill use white.)
- **Mode:** `auto`/`light`/`dark`, persisted; live re-render; StatusBar + native bg flip. Temporary
  toggle on the **More** tab (permanent UI lands Phase 9). Splash/adaptive-icon bg `#121c30`.

---

## 5) Terminology (web-aligned — NO "invest"/"own" in user-facing copy)

Use the web's exact strings (already in `src/locales/{en,ar}.json`). Key mappings:

| UI text | i18n key | en | ar |
|---|---|---|---|
| Funds tab / list title | `sidebar.funds` / `tabs.assets` | Assets / Assets | الأصول المتاحة / الأصول |
| Card action | `common.learnMore` | Learn More | اعرف المزيد |
| Detail primary action (Buy) | `common.invest` | **Buy** | **اشترِ** |
| (Buy Now variant, web) | `opportunity.investNow` | Buy Now | اشترِ الآن |
| My investments tab | `tabs.holdings` / `sidebar.myFunds` | Holdings / My Holdings | حيازاتي |
| Doc preview action | `common.download` | Preview | عرض |
| Detail sections | `opportunity.{investmentInformation, financialDetails, shareDetails, verificationAndRatings, importantDocuments}` | Asset Information / Financial Details / Share Details / Verification & Ratings / Important Documents | … |
| Stat labels | `opportunity.{pricePerShare, availableShares, totalInvestment, contractType, insurance, duration, roi, minShares}` | Price / share, Available Shares, Total Asset Value, Contract Type, Insurance, Duration, Returns, Minimum Shares | … |
| Tab labels (short) | `tabs.{assets,holdings,wallet,portfolio,market,more}` | Assets/Holdings/Wallet/Portfolio/Market/More | الأصول/حيازاتي/المحفظة/الأداء/السوق/المزيد |

- The user-facing word is **"Buy"** (`common.invest` = "Buy"/"اشترِ") — the key is named `invest` but the
  VALUE is "Buy". Removed the stray `opportunity.invest` key. Card shows ONLY "Learn More"; **Buy lives
  inside the detail page**, not on the card.
- Note: `opportunity.*` already existed from the web (investNow, cimVerification, etc.). New badge keys
  added: `opportunity.{available, insured, cimVerified, cimRated, hccInsured, viewDetails}` + `tabs.*`.

---

## 6) RTL (summary — full detail in CLAUDE.md §8)

English forced **LTR**, Arabic forced **RTL**, correct after login + reload. `LanguageContext`
reconciles the native `I18nManager` flag with the saved language at boot and on change, doing a
**one-time `expo-updates` reload** on a direction mismatch, guarded by `app.rtl.reloadGuard` (no loop).
Components mirror via the language-derived `isRTL` from `useLanguage()`. **Verified working on device.**

---

## 7) Backend / live-response findings (verified against api.capimaxinvestment.com)

- **Type warning (STRINGS → `parseFloat`/`Number` before ANY math):** opportunity
  `price_per_share`, `roi_percentage`, `total_investment`; wallet `balance`, `profit_balance`
  (note `total_balance` is numeric); `my_investments` amounts (`total_amount_invested`,
  `amount_invested`) and portfolio `current_stats` percentages. **Every money/percent value is
  `parseFloat`'d in code regardless of type** so string-vs-number never breaks. (API_AND_FLOWS §4.1.)
- `images[]` = `{ id, image_url, caption_en, caption_ar, is_primary, order }` (sort primary→order).
- `cim_verification` / `cim_rating` / `hcc_insurance` = objects `{ enabled, display_text, link (nullable), code }`
  (also flat `*_enabled/_link/_code`).
- `total_shares`, `purchased_shares`, `account_manager`, **`Investement_Cycle`** (backend typo — use the
  key AS-IS), `*_en/*_ar` localized variants.
- `description` MAY contain HTML → render via `src/utils/html.js` `htmlToText` (strips tags/scripts,
  keeps line breaks). Never `dangerouslySetInnerHTML`-equivalent.
- 6 document URLs are Google-Drive share links (field→label table in API_AND_FLOWS §4.1).
- **Auth error envelopes (live):** login invalid creds → `401 {status:"error", code, message}` (text in
  `message`; public endpoint → no forced logout). Register validation → `400 {success:false, message, errors:{field:[...]}}`.
- **Token envelope is per-endpoint:** login/google → `data.data.access/.refresh`; verify → `data.token`;
  refresh → `data.access`. (API_AND_FLOWS §0.)
- Pagination: list endpoints return `{count,next,previous,results}`; internal-market lists return named
  arrays (`{listings:[]}` etc.).

---

## 7b) Payment methods are LIVE (real money) — Phase 4

> **Owner decision (binding): ALL FIVE payment methods run against LIVE/production config.
> There is NO sandbox/test-mode gating in the app — do NOT reintroduce one.**

- `app.json extra`: `paypalEnv: "live"`, `paypalClientId` = the live PayPal client id (same as web
  `.env.production` / `config/paypal.js`), `paypalCurrency: "USD"`, `webOrigin` for NOWPayments
  success/cancel URLs.
- **PayPal** → `src/components/invest/PayPalWebView.jsx` hosts the live PayPal JS SDK (capture intent,
  card on, paylater/venmo off), captures, posts the capture back; route calls
  `process_paypal_payment/` (refund on 500). **Real money on buyer approval.**
- **NOWPayments** → `create-invoice/` → hosted_url in `NowPaymentsWebView.jsx` + poll
  `status/{invoiceId}` every 5s (30-min cap). Backend holds the live NOWPayments key. **Real crypto.**
- **Bank / Crypto-manual / NovaPay** → multipart proof upload (`process_bank_transfer` /
  `process_crypto_transfer` / `process_novapay`); real pending payment records, manual back-office
  verification. Bank/crypto wallet destinations are REAL (copied verbatim into
  `src/components/invest/paymentData.js`) — do not edit without confirming against the dashboard.
- **Contract step (3) runs for ALL 5 methods** (matches the web's shared `handlePaymentSuccess`):
  each method resolves a `transaction_id`, then `contracts/create` { contract_type:'investment',
  investment_opportunity_id, payment_transaction_id, investment_amount: total } → `contracts/:id`
  (render `contract_html`) → typed e-sign. The manual methods' resolved id is always a non-empty
  string (real id or the same sentinel the web sends: `BANK_TRANSFER` / `NOVAPAY` /
  `Pending Verification`), so it is valid to pass to `contracts/create`.
- **Step 4 status** reflects the PAYMENT, not the contract: gateways → **Completed**; manual methods →
  their pending status (**Processing** / **Pending Verification**) even though the contract is signed.
- **Money:** `price_per_share` is a STRING → `parseFloat`; total carried forward is rounded to 2 dp so
  the charged amount equals the displayed amount.

---

## 7c) Known issues (deferred)

- **Step 3 contract sign — typed-signature input is covered by the Android keyboard.** The contract
  scrolls fine; the bug is only the signature field being hidden behind the keyboard on Android.
  **Deferred to Phase 10 polish.** ⚠️ **Do NOT retry the "collapse-the-contract-while-signing"
  approach** — it was implemented in commit `0ff5836` and **broke the app** (multiple errors /
  regressions), so it was hard-reset out (back to `6eec5f7`). When revisited, use a *different*
  approach (e.g. a dedicated sign route/modal, or `react-native-keyboard-controller`), not the
  focus-collapse toggle.

---

## 7d) Internal Market (Phase 7) — flow + decisions

> Derived from the web `pages/internal-market/index.jsx` (read in full). LIVE payments, same as Phase 4.

- **Reads** (all named arrays, never paginated): `internal-market/{listings,holdings,user-listings,
  transactions,statistics}/` → `data.{listings,holdings,listings,transactions,statistics}`.
- **SELL (Flow E)** — `CreateListingSheet`: only when `holding.can_sell_shares === true`; POST
  `create-listing/` `{ investment_id, shares_to_sell, asking_price_per_share, listing_type }`. The
  financial breakdown (normal 2% fee · fast 7.5% discount + 5% fee) is **client-side display only**
  (exact web math) — the backend computes the real numbers. Deep-link `createListing=true&opportunityId`
  from MyFunds opens the sheet for the matching holding (waits for holdings to load).
- **BUY (Flow F)** — `market/buy/[listingId].jsx`: POST `purchase/` `{ listing_id, shares,
  payment_method }` FIRST (all methods), then branch on `data.payment.status`/method:
  wallet(completed)→contract; bank_transfer→`bank-transfer-upload/` multipart (pending, no contract);
  credit_card→PayPal capture→`paypal-complete/`→contract; crypto→**generic** NOWPayments
  `create-invoice/` with **`opportunityId:null`** (same endpoint as Phase 4, web parity) + 5s/30m poll
  →contract. `market_transaction_id` = purchase `transaction.transaction_id` (or the paypal-complete
  transaction id for cards). Success screen reads `response.data.summary` (graceful fallbacks; the
  crypto path has no server summary so we build a display summary like the web).
- **Contract reuse:** `ContractStep` now takes an optional `createPayload` →
  `{ contract_type:'internal_market', market_transaction_id }`. Same typed e-sign + idempotent-400 logic.
- ⚠️ **Two items to confirm with the owner (flagged, sensible defaults chosen — see report):**
  1. **Bank-transfer destination:** the web shows *placeholder* bank details ("Example Bank / 1234567890")
     — clearly mock, so NOT replicated. We reuse the **real platform `BANK_ACCOUNTS`** (the same
     owner-confirmed accounts as the Phase-4 Buy flow). Confirm internal-market bank transfers go to
     those same accounts.
  2. **Gateway charge amount:** for PayPal/crypto we charge `purchaseResult.amount` (backend-authoritative)
     when present, else the client subtotal `shares × asking_price`. The web's PayPal path used the
     subtotal directly; we prefer the backend `amount` for live-money correctness (the web's crypto path
     already does this). Confirm the purchase response returns an `amount` and whether the buyer pays the
     subtotal or the fee-inclusive total.
- **Minor divergence (intentional):** if `contracts/create` fails the web alerts and proceeds to success
  *without* a signature; we keep `ContractStep`'s error+Retry instead (never skip the legally-binding
  signature) — consistent with the Phase-4 Buy flow.

---

## 8) Deferred / open items (decisions locked in API_AND_FLOWS §6)

- **#2 Change-password endpoint** — the web page has **no API**; owner to provide endpoint+payload
  **before Phase 8**. Do not invent.
- **#8 Manual-payment verification** — bank/crypto-manual/NovaPay stay pending; **no auto-contract for
  bank transfer** (match web). Owner to confirm before finalizing **Phase 4**.
- **#10 Google OAuth client IDs** — not yet provided. `GoogleSignInButton` is wired but **gated**: shows
  a disabled button until `app.json extra.google.{iosClientId,androidClientId,webClientId}` are set, then
  it activates with no code change. Build email/password first.
- **#11 PayPal on mobile** — approved approach: **WebView-hosted PayPal SDK** reusing the same live client
  id; same `process_paypal_payment` / `paypal-complete` payloads.
- **Reset-password deep link** — universal-link wiring is a **Phase 10** task; the screen reads `token`
  from params and is otherwise functional.

---

## 9) Working conventions (also CLAUDE.md §0, §10; DESIGN.md §11)

- Every screen: **real endpoint from API_AND_FLOWS** (zero mock) + **Loading (skeleton) / Empty / Error**
  states + works in **both modes** and **both languages (RTL)**.
- Every component reads colors/spacing/type/elevation from `useTheme()` and handles RTL; press feedback
  (PressableScale) on tappables; entrance motion on lists; reduce-motion respected.
- Commit after every phase with a clear message (`Co-Authored-By: Claude Opus 4.8`). Keep this file +
  API_AND_FLOWS current when something new is discovered/decided.
- Admin endpoints (`/api/admin/...`) are **out of scope** (investor app only).
