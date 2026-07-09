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
| 8 | Account (users/me) + Edit profile (Flow H passport upload) + Change-password (LIVE — OQ#2 resolved, sign-out on success) | ✅ done |
| 9 | Contact(feedback) + FAQ + legal/[type] (terms/statement/policy) + Document Center + Our Platforms + real Settings (More) | ✅ done |
| 10 | Real PDF downloads: signed contracts (auth blob) + opportunity document links (Drive/uc download) ✅. Remaining: final polish/QA + **EAS build (saved for the very end)** | ✅ done (polish/EAS pending) |

**Phases 1–10 are functionally complete** (auth · assets+detail · Buy flow with all 5 LIVE payment
methods + contract for all 5 · wallet+withdraw · holdings · portfolio · internal market · account/edit
· change-password [LIVE, OQ#2 resolved] · contact/faq/legal/document-center · PDF downloads).

### 1b) Beyond the 10 phases — also DONE
- **Onboarding** — 9 pre-login slides, shown **every launch before login** (not once-only). `app/
  onboarding.jsx`; entry gate routes unauthenticated users here → `/(auth)/login`.
- **Tab restructure** — **Home · Assets · Holdings · Portfolio · Market · More**. **Wallet removed
  from the tab bar** → relocated to `app/wallet.jsx` (pushed screen w/ back header), opened from the
  Home header wallet icon + a More row. **Home is the default tab** after login.
- **Home page** (`app/(tabs)/home.jsx`) — header (welcome + username + wallet/notifications icons) ·
  portfolio-value card (`wallet/summary.total_balance` + portfolio `total_value` sparkline + growth%
  chip) · 6 static value-prop tiles · featured-assets horizontal slider (first 6 opportunities) ·
  secondary-market list (first listings). **COPY RULE: no "Trade"/"Invest" words on Home — icons + scroll.**

### 1c) Recently shipped (post-phase polish)
- **(A) Code-animated SVG splash** ✅ — brand logo rendered as a crisp **vector** via
  `react-native-svg` (`src/components/SplashLogo.jsx`, generated from `assets/splash-logo.svg`;
  CSS `<style>` classes resolved to explicit fills since RN-SVG ignores `<style>`). Full-screen
  `#121c30`, logo ~66% width contained (never cropped). `react-native-reanimated`: fade-in +
  scale 0.92→1.0, brief hold, fade-out (~2–2.5 s); reduce-motion → fade only. Holds the native
  splash via `expo-splash-screen`; fails open (error boundary) if the SVG can't render.
  `src/components/AnimatedSplash.jsx`, wired in `app/_layout.jsx`. **Replaced** the old Lottie
  splash (`lottie-react-native` + `splash.json` removed) which pixelated (it was a raster frame
  sequence, not vector).
- **(B) Biometric quick-unlock** ✅ — Face ID + fingerprint as a **local convenience lock** over the
  secure-store session (backend has **no** biometric auth; device-side only, password never stored).
  `src/utils/biometrics.js` (capability + prefs via `expo-local-authentication`), `AuthContext`
  `isLocked`/`unlock`/`enable`/`disable`, `src/components/LockScreen.jsx` (auto-prompt + retry +
  "use email & password" fallback), enroll prompt after first login, toggle in More → Settings →
  Security (en + ar, both themes, RTL). Locks only when enabled **and** device still enrolled, so a
  removed sensor never locks the user out (commit `68c4b78`).

### Repo
- Pushed to GitHub: **https://github.com/Daamah-Digital-Solutions/expo-mobile-capimax** (branch `master`).

Detailed per-phase "Ready prompts" + Definitions of Done are in `BUILD_PLAN.md`.

---

### 1d) CLIENT HOMEPAGE REVAMP — PHASE A COMPLETE (started 2026-06-06)
Client MD note requested homepage + More/Wallet/Opportunities changes. **Owner decisions:** backend-blocked
features → show **"coming soon"** (don't invent endpoints); **start Phase A now**; **About Us copy written by
us** (owner reviews). Full analysis/plan was delivered in chat.

**Backend feasibility — CONFIRMED (live probe + web scan):**
- ❌ **Crypto withdrawal** — NO endpoint. `POST /api/wallet/withdraw/` is **bank-only** (no method/address field).
- ❌ **Wallet deposit / top-up** — NO endpoint (the web itself has only a `console.log` stub). Funds enter only via investment purchase.
- ❌ **Pronova (PRN) as a payment method** — NOT a payment method (partner-platform link only); no endpoint, no 5% bonus logic.
- These 3 are **Phase C (need backend)** → surfaced as "coming soon" per owner.

**Real data gathered (zero-mock):**
- Platforms (3 real, in `src/constants/platforms.js`): Capimax RT `capimaxrt.tech` · Nova DeFi `novadf.com` · Pronova Crypto `pronovacrypto.tech`. Pronova ecosystem URL = `pronovacrypto.tech`. Client wants **5** (adds **Capimax BRX** + **Capimax PropShare** — NOT in web → need owner: name/url/desc/logo).
- Contact (real, now live): USA `418 Broadway, Ste R, Albany, NY 12207` + `30 N Gould St Ste R, Sheridan, WY 82801` (ph `0012342795751`); UK `128 City Road, London, EC1V 2NX` + `167-169 Great Portland Street, 5th Floor, London, W1W 5PF` (ph `00447441358588`). Emails `info@capimaxinvestment.com` / `contact@capimaxinvestment.com`. **UAE removed.**
- Verification/Partners: **no institutional CIN/links exist in web** → need owner data. `src/constants/accreditations.js` holds CIM/HCC/Assurax with `link/code = null` → UI shows "coming soon" until filled.
- No Live Chat / WhatsApp in web → need WhatsApp number + Live Chat provider decision.

**Phase A — COMPLETE (pushed):**
- `c943dae` home redesign (8 value tiles + Our Platforms + Access Pronova CTA + Featured moved up).
- `84ef8bd` About Us (`app/about.jsx`) + Verification (`app/verification.jsx`) pages + More rows; contact USA/UK + opportunity external-verify link relabel (up to `ea78c96`).
- `59ce53b` coming-soon surfaces (no invented endpoints): More **Contact & Support** (Contact Us live + **WhatsApp** + **Live Chat** "Soon" rows → info alert) · Wallet **Deposit** button → `DepositSheet` (bank/crypto/other, all coming-soon) · Withdraw **Bank \| Crypto** toggle (crypto = coming-soon panel, live bank flow unchanged) · **Pronova** payment method in invest `PaymentStep` + internal-market buy (coming-soon panel; guarded — `completePurchase` early-returns, Complete button disabled, so it never POSTs).

**Phase B — IN PROGRESS (owner sent logos + platform domains):**
- `b5d76e6` **DONE**: Partner brand logos (CIM/HCC/Assurax) generated from source SVGs → `src/constants/brandLogos.js` (each `.stN` class resolved to explicit fill/clip-path at generation time; metadata/style/entity-ns stripped; well-formed per xmldom) rendered by `src/components/PartnerLogo.jsx` (`SvgXml`). New Home **"Strategic Partners"** section + real logos on the **Verification** page (`accreditations.js` gained a `logo` key). Added **Capimax BRX** (`capimaxbrx.com`) + **Capimax PropShare** (`capimaxpropshare.com`) → **5 platforms** with en/ar descriptions.
  - Regenerate logos: `node <scratchpad>/gen_partner_logos.js` (source: `E:/Work/capimax-group/src/assets/logos-needded/{cim ,hcc,assurax}.svg`).
  - ⚠️ **On-device QA:** HCC/CIM are gradient-mesh logos (clipPath+use, 180–230 polygons) rendered as vector — verify they render cleanly on a device; if not, ask owner for flat PNG exports. Assurax is flat (22 paths).
  - BRX/PropShare **descriptions** = owner's official copy (en; ar translated). BRX includes the "registered tech platform, not a financial/investment/brokerage actor; offerings via qualified independent entities under Regulation D / Regulation S" compliance note — keep this wording intact.
- `0e30774` **DONE**: **Our Platforms** now renders every platform's REAL logo on dark branded cards (mirrors the web). Light-on-dark logos: `capimaxrt.svg` (already white) + BRX/PropShare recoloured navy→white → `src/constants/platformLogos.js` (SvgXml); Nova + Pronova brand PNGs (from the web) in `assets/platform-logos/` (Image). `src/components/PlatformLogo.jsx` picks the renderer + fits each to a box. Home platform card + `/platforms` redesigned as dark gradient cards (always-dark so logos read in both themes). Renamed **Nova DeFi → "Nova Digital Finance"**. Section headers restyled (accent bar + bold title + pill See-all). Regenerate platform logos: `node <scratchpad>/gen_platform_logos.js`.
- **STILL BLOCKED ON OWNER DATA:** real Verification codes+links (fill `accreditations.js` `link`/`code`) · WhatsApp number + Live Chat provider · About Us copy review.
**Phase C — BLOCKED ON BACKEND:** Deposit, Crypto withdraw, Pronova payment endpoints.

Conventions kept: zero-mock, no invented endpoints, brand "Capimax", both themes + RTL, `expo export` + `expo-doctor 18/18` gate, commit per logical step.

---

## 2) What's built (file map)

```
app/
  _layout.jsx            providers (Theme→Language→Auth) + auth gate + splash + StatusBar
  index.jsx              entry gate: authed → /(tabs)/home · else → /onboarding (post-login dest also /home)
  onboarding.jsx         pre-login sliders (every launch, before auth) — all 9 slides. FlatList
                         pager, dots (active = green pill), Skip/Next→Get Started → /(auth)/login.
                         RTL-safe via onViewableItemsChanged. Pager auto-scales to slide count.
  (auth)/ login, register, verify, forgot-password, reset-password   (Phase 2, all functional)
  (tabs)/ _layout (TabBar; initialRouteName=home) — order: home · funds(Assets) · myfunds
          (Holdings) · portfolio · market · more. Home is default after login. Wallet REMOVED
          from tabs → relocated to app/wallet.jsx (opened from Home header + More).
  home.jsx (tab)         Home: greeting+wallet/notif header · portfolio-value card (wallet
                         total_balance + portfolio total_value sparkline + growth chip) · 6 static
                         value-prop tiles · featured-assets slider · secondary-market list.
                         COPY RULE: no "Trade"/"Invest" words — icons + scroll only.
  wallet.jsx             relocated wallet (was a tab) — pushed screen w/ back header (P5 logic)
  contact.jsx            Contact + feedback form (P9): users/me prefill → POST feedback
  faq.jsx                FAQ accordion (P9, faq.* keys)
  legal/[type].jsx       terms-conditions (Drive link) | statement | policy-insurance (P9)
  document-center.jsx    Documents (download/open) + signed-contract PDF download (P9→P10)
  platforms.jsx          Our Platforms — 3 sister sites, open externally (P9)
  opportunity/[id].jsx   Opportunity detail (Phase 3)
  invest/[id].jsx        REAL 4-step Buy flow machine (Phase 4): gate→amount→payment→contract→complete
  market/buy/[listingId].jsx  REAL internal-market BUY machine (Phase 7): shares→method→
                         purchase→branch(wallet/bank/PayPal/crypto)→contract→success
  account.jsx            REAL profile view (Phase 8): users/me → info + doc-verification card
  edit-profile.jsx       REAL Edit/Complete Profile (Phase 8, Flow H): prefill + multipart
                         complete_profile (passport upload). Buy gate routes here.
  change-password.jsx    LIVE (OQ#2 resolved): POST /api/change-password/ {current,new,confirm};
                         field-level errors (new_password string|array); success → sign out + login.
src/
  api/ client.js (axios + interceptors + refresh), services.js (all endpoints), tokenStorage.js (SecureStore)
  context/ ThemeContext, LanguageContext, AuthContext
  theme/ palettes.js (dark+light colors), tokens.js (spacing/radii/type/motion/elevation)
  i18n/ index.js          locales/ en.json, ar.json
  components/ AppButton, Card, AssetCard, StatTile, ReturnPill, Chip, Badge, SegmentedControl,
              Field, SelectField (searchable dropdown, P8), Banner, AuthCard, SectionHeader,
              EmptyState, BottomSheet, Skeleton, Screen, PlaceholderScreen, GoogleSignInButton
  constants/ countries.js (COUNTRIES — copied verbatim from web, nationality select)
  components/ + Sparkline (tiny svg line+area), home/FeaturedAssetCard (compact horizontal asset card)
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
- **`expo-file-system` + `expo-sharing`** (P10) for real downloads — `src/utils/fileDownload.js`.
  Uses the file-system **LEGACY** API (`expo-file-system/legacy`) because `downloadAsync` returns the
  HTTP status (needed for 401/404/400); the new `File` API does not. Both are in Expo Go (no dev build).
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

## 7e) Support / Legal / Settings (Phase 9) — findings + decisions

> Derived from web pages/{contact,feedback,faq,terms-conditions,legal,policy-insurance,document-center,platforms}.

- **External links open via `expo-web-browser`** (`WebBrowser.openBrowserAsync`) — the web uses
  `target=_blank`. `document_url`, `statement_url`, `policy_insurance_url`, and the Terms Drive links
  are all **publicly openable** (no auth header needed — the web opens them with a plain `href`).
- **Terms & Conditions ≠ inline text:** the web `pages/terms-conditions` opens a **language-specific
  Google-Drive PDF** (en/ar links hardcoded — copied verbatim into `app/legal/[type].jsx`
  `TERMS_LINKS`). There is no inline terms text to render. (The Phase-9 ask said "from translations";
  the faithful web behavior is the Drive link.)
- **Contact = branch info + feedback form** merged: 3 branch cards (real UAE/UK/USA phones + email,
  verbatim) + the functional feedback form (`pages/feedback`). Email prefilled from
  `users/me.user_details.email`; `POST /api/feedback/` `{ email, subject, message,
  email_to:'contact@capimaxinvestment.com', user_email }`; success on `data.status==='success'`.
- ✅ **Document Center downloads — DONE in Phase 10.** Signed contracts (`GET
  /api/contracts/user-contracts/` → `status==='signed'`) download the **auth-protected PDF blob**
  (`GET /api/contracts/{id}/download/` with Bearer) → cache → OS share/save sheet (401/404/400 mapped).
  Regular documents get a **Download** action (direct file → cache + share; Drive viewer link → open
  externally). Mechanism: `src/utils/fileDownload.js` on `expo-file-system` (LEGACY API for the HTTP
  status) + `expo-sharing` (both bundled in Expo Go). The util refreshes the token once on a 401.
- **Platform logos** (`/platform-logos/*.svg|png`) are web-only assets → mobile uses an accent Ionicon
  per platform. Names/URLs/descriptions are the real ones (verbatim).
- **Settings (More tab)** is now the real hub (account links + support/legal links + theme + language +
  about/version). The permanent theme/language UI replaces the Phase-1 temporary toggles.

---

## 8) Deferred / open items (decisions locked in API_AND_FLOWS §6)

### NEXT UP (in progress, not yet built)
- **(A) Animated Lottie splash** from `mobile/splash.json` — replace/augment the static splash.
- **(B) Biometric quick-unlock** — Face ID + fingerprint as a **local convenience lock** over the
  existing secure-store session. The backend has **no biometric auth** — this is device-side only
  (e.g. `expo-local-authentication` gating access to the stored session; no new API calls).

### Still deferred
- **#10 Google OAuth — ✅ DONE (activated 2026-06-06; all client IDs wired). Testable in a dev/EAS build only.**
- **Android contract-sign keyboard** — stable as-is; ⚠️ **do NOT retry the `0ff5836` collapse approach** (§7c).
- **Final polish / QA pass** — then **EAS build (saved for the very end)**. Do not run EAS until asked.

---

- **#2 Change-password endpoint — ✅ RESOLVED (live).** `POST /api/change-password/` (authed)
  `{ current_password, new_password, confirm_password }` → 200 `{ status:'success', message,
  reauth_required:false, detail }`. Wired in `userService.changePassword` + `app/change-password.jsx`
  (`ENDPOINT_READY=true`). 400 errors are field-level under `errors.<field>`; **`new_password` may be a
  STRING or an ARRAY of reasons** — both handled (all reasons rendered). On success the backend
  blacklists the old refresh token, so the app **signs out + routes to `/(auth)/login`** (re-auth with
  the new password) — cleanest match to the backend's "log in again" guidance.
- **#8 Manual-payment verification** — bank/crypto-manual/NovaPay stay pending; **no auto-contract for
  bank transfer** (match web). Owner to confirm before finalizing **Phase 4**.
- **#10 Google OAuth — ✅ NATIVE SDK (2026-06-06).** Uses **`@react-native-google-signin/google-signin`**
  (NOT expo-auth-session — removed). Why: Google blocks the implicit `response_type=id_token` browser flow
  for native (Android/iOS) clients (returns `invalid_request`), and that flow's token audience would be the
  native client, which the backend rejects. The native SDK signs in with the device's Android/iOS client
  (package + SHA-1) and — with **`webClientId` set as the server client id** in `GoogleSignin.configure()`
  — returns an id_token whose **`aud` = the WEB client id** (what the backend verifies). Flow unchanged:
  `idToken` → `signInWithGoogle` → `POST /api/auth/google/ { credential: idToken }` →
  `data.data.{access,refresh,email,username,is_new_user}` → tokens via `applyTokens` (fires biometric enroll).
  - Client IDs (Google Cloud project `2857014122`) in `app.json extra.google`: **webClientId** =
    `2857014122-atnfes15aq8irqnldfnpqq9nr285phka` (server/audience), **androidClientId** =
    `1044086354511-6k08oi5ifn2l9f1t9koqt7c9go5vercv`, **iosClientId** =
    `1044086354511-hgope6us8jjava85o69p31n4rbkasefh`.
  - Config plugin `@react-native-google-signin/google-signin` added with
    `iosUrlScheme: com.googleusercontent.apps.1044086354511-hgope6us8jjava85o69p31n4rbkasefh` (the plugin now
    owns the iOS URL scheme; the manual `ios.infoPlist.CFBundleURLTypes` entry was removed).
  - ⚠️ **Native module → dev/EAS build only, NOT Expo Go** (button shows a disabled note in Expo Go via
    `Constants.executionEnvironment === StoreClient`).
  - **EAS upload-key SHA-1** (in the Android OAuth client): `9F:D6:1E:74:F4:E1:52:20:E7:E5:43:9B:6E:D3:DF:4B:41:87:B7:0D`.
  - ⚠️ **Play App Signing SHA-1** must ALSO be added to the Android OAuth client when publishing to Play
    Store (Play Console → Setup → App signing → SHA-1).
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

### Conventions to KEEP (owner-confirmed, do not regress)
- **Web terminology** — user-facing word is **"Buy"/"اشترِ"** (Available Assets / Learn More). **No
  "Trade" or "Invest" in copy**, and **especially none on the Home page** (icons + scroll only).
- **`parseFloat` every string money field** before any math (`price_per_share`, `roi_percentage`,
  `total_investment`, wallet `balance`/`profit_balance`, `my_investments` amounts, listing prices,
  portfolio percentages). `total_balance` is numeric but is `parseFloat`'d anyway.
- **Theme** — navy-dark `#121c30` + Stake-light, identical token names via `useTheme()` (Rule #4:
  `onPrimary #0b2928` on green fills).
- **i18n/RTL** — English LTR, Arabic RTL; add every new key to **both** `en.json` + `ar.json`.
- **All payments are LIVE** (real money) — **no sandbox/test guard anywhere** (§7b). Do not reintroduce one.
- **Zero mock** — real Loading/Empty/Error states only; never fabricate data.
- **Validation before commit** — `npx expo export --platform ios` bundles clean **and** `npx expo-doctor`
  18/18. The owner tests on a real Android device (Expo Go SDK 54).
