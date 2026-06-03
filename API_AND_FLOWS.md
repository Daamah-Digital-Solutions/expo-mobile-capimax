# API_AND_FLOWS.md — CapiMax API & Flows Contract

> **Source of truth.** Derived entirely by reading the web project
> `CapiMaxDashboardPanel` (React + Vite). Nothing here is invented — every endpoint,
> payload key, and response field below is taken from actual web code. Paths are quoted
> exactly as the web sends them. Where the web reads a nested response path
> (e.g. `response.data.data.access`), that exact nesting is recorded.
>
> From Phase 1 onward this file is the contract the mobile app builds against.
> **Never call an endpoint that is not in this file.** Open questions are listed at the end —
> resolve them with the owner before relying on the affected behavior.

---

## 0) Backend base URL & global conventions

- **Production base URL:** `https://api.capimaxinvestment.com/`
  - Confirmed from `.env.production` (`VITE_API_URL`) and `CLAUDE.md §2`.
  - Local dev in the web uses `http://127.0.0.1:8000/` (`.env`), but mobile ships against production.
  - **Mobile:** put this in `app.json` → `expo.extra.apiUrl`, read via `expo-constants`. Never hardcode in a component.
- **Framework:** Django REST Framework.
- **Content-Type:** `application/json` for JSON calls; `multipart/form-data` for file uploads.
- **`Accept-Language` header** is sent on **every** request, set to the current i18n language (`en` / `ar`). Backend returns language-specific text (category names, etc.).
- **Pagination:** DRF list endpoints return `{ count, next, previous, results }`. Confirmed in web for: `/api/opportunities/`, `/api/categories/`, `/api/wallet/`, `/api/wallet/transactions/`, `/api/wallet/withdrawals/`, `/api/documents/`. Internal-market list endpoints instead return a **named array** (e.g. `{ listings: [...] }`, `{ holdings: [...] }`) — see each below.
- **PayPal client id (live):** `AZHEGDb90rDEPUTjBV5cssSfewEAQrwG8cMy0W6NUdj8hLk_XPedJ_hhsJ0m9AG07AfsbBMbkTKhtwyw` (from `.env.production`).

### Auth / token model
- Two tokens stored on web in `localStorage`: key `access` and key `refresh` (`src/api/constants.js`). **Mobile stores these in `expo-secure-store`.**
- **Public endpoints** (no `Authorization` header) — from `src/api/api.js` regex list:
  - `POST /api/user/register/`
  - `POST /api/user/token/`
  - `POST /api/verify-email/`
  - `POST /api/resend-verification/`
  - `GET  /api/opportunities/`
  - `GET  /api/opportunities/{id}/`
  - `GET  /api/categories/`
  - *(In practice also public but NOT in the regex list: `POST /api/auth/google/`, `POST /api/forgot-password/`, `POST /api/reset-password/`, `POST /api/token/refresh/`. See Open Questions #1.)*
- All other endpoints attach `Authorization: Bearer <access>`.
- **Response interceptor:** on `401`/`403` for a **non-public** endpoint → clear both tokens and redirect to login. (Web uses `window.location.href='/auth/login'`; mobile must do this via `AuthContext` → `router.replace('/(auth)/login')`.)
- **Token refresh** exists via `POST /api/token/refresh/` (web `ProtectedRoute.jsx` decodes the access JWT `exp` and refreshes when expired). Mobile should replicate this before forcing logout.

> ⚠️ **Token envelope is inconsistent across endpoints** (verified in code):
> - Login `POST /api/user/token/` → tokens at **`response.data.data.access` / `.refresh`** (and `response.data.data.is_verified`, `.email`).
> - Google `POST /api/auth/google/` → **`response.data.data.access` / `.refresh`**.
> - Verify-email `POST /api/verify-email/` → **`response.data.token`** (and optional `response.data.refresh`).
> - Refresh `POST /api/token/refresh/` → **`response.data.access`**.

---

## 1) Screens & routes (web → mobile mapping)

From `src/routes/Router.jsx`. "Auth" = web wraps it in `ProtectedRoute`.

| Web route | Web component | Auth | Purpose | Mobile route (planned per CLAUDE.md §4) |
|---|---|---|---|---|
| `/` and `/funds` | `pages/funds` | public | Available opportunities list | `/(tabs)/funds` |
| `/platforms` | `pages/platforms` | public | "Our Platforms" (static) | `/(tabs)/more` → platforms |
| `/opportunity/:id/*`, `/opportunities/:id` | `views/OpportunityDetailPage` | public | Opportunity detail | `/opportunity/[id]` |
| `/opportunities/:id/invest` | `OpportunityDetailPage` (invest tab) | **auth** | Invest flow entry | `/invest/[id]` |
| `/myfunds/*` | `pages/myfunds` | **auth** | My investments + sell logic | `/(tabs)/myfunds` |
| `/wallet/*` | `pages/wallet` | **auth** | Balances, transactions, withdrawals | `/(tabs)/wallet` |
| `/portfolio/*` | `pages/portfolio` | **auth** | Portfolio performance + chart | `/(tabs)/portfolio` |
| `/internal-market/*` | `pages/internal-market` | **auth** | Secondary market | `/(tabs)/market` |
| `/account/*` | `pages/account` | **auth** | Profile + verification status | `/account` |
| `/edit/` | `pages/edit` | (route not protected, but gated by content) | Profile completion / passport upload | `/edit-profile` |
| `/change-password/` | `pages/change-password` | (not protected) | Change password (**UI only — no API**, see OQ#2) | `/change-password` |
| `/bank-account/` | `pages/bank-account` | (not protected) | Bank account form (**static, no API**) | (skip / informational) |
| `/contact/*` | `pages/contact` | **auth** | Contact info (**static, no API**) | `/contact` |
| `/request/*` | `pages/feedback` | **auth** | Feedback form → `/api/feedback/` | `/contact` (feedback) |
| `/faq/*` | `pages/faq` | **auth** | FAQ (from translations) | `/faq` |
| `/document-center/*` | `pages/document-center` | **auth** | Documents + signed contracts | `/document-center` |
| `/statement/*` | `pages/legal` | **auth** | Statement doc link (`users/me`) | `/legal/[type]` |
| `/policy-insurance/*` | `pages/policy-insurance` | **auth** | Policy/insurance doc link (`users/me`) | `/legal/[type]` |
| `/terms-conditions` | `pages/terms-conditions` | **auth** | Terms (from translations) | `/legal/[type]` |
| `/auth/login`, `/login` | `pages/auth/Login` | public | Login | `/(auth)/login` |
| `/auth/register`, `/register` | `pages/auth/Register` | public | Register | `/(auth)/register` |
| `/auth/verify`, `/verify` | `pages/verify/VerifyEmail` | public | Email verification | `/(auth)/verify` |
| `/auth/forgot-password` | `pages/auth/ForgotPasswordForm` | public | Forgot password | `/(auth)/forgot-password` |
| `/reset-password/:token` | `pages/auth/ResetPasswordForm` | public | Reset password | `/(auth)/reset-password` |
| `/payment-success/` | `views/PaymentSuccessPage` | public | Post-investment success | `/payment-success` |
| `/auth/logout`, `/logout` | clears storage | — | Logout | (AuthContext logout) |

**Out of scope (CLAUDE.md §11):** all `/api/admin/...` endpoints (fee management, portfolio settings/overrides). The web `FeeManagement.jsx` and admin `portfolioService` methods exist but are **not** used by the investor app.

---

## 2) Endpoint catalog

Notation: 🔓 = public (no token), 🔒 = requires `Authorization: Bearer <access>`.
All requests also send `Accept-Language`.

### 2.1 Authentication

#### 🔓 `POST /api/user/register/`
- **Request:** `{ username, email, password }` (all `.trim()`ed).
- **Response read:** `response.data.success` (bool), `response.data.message`, `response.data.errors` (field→messages object on failure).
- On success the web navigates to verify-email (no token returned here).
- **Verified live (2026-06-03):** validation failure → `HTTP 400 {success:false, message:"Validation failed", errors:{field:[msg]}}`.

#### 🔓 `POST /api/user/token/`  (LOGIN)
- **Request:** `{ email, password }`.
- **Response read:**
  - `response.data.data.is_verified` (bool)
  - `response.data.error` (string; e.g. `"Account not verified"`)
  - `response.data.data.access`, `response.data.data.refresh` (JWTs)
  - `response.data.data.email`
- See Flow A.
- **Verified live (2026-06-03):** invalid credentials → `HTTP 401 {status:"error", code:"invalid_credentials", message:"Invalid email or password"}` (error text in `message`). Because `/api/user/token/` is public, a 401 here must NOT force logout. The mobile client treats this as a normal error and surfaces `message`. The "Account not verified" case may likewise arrive as an error envelope (handle `code`/`message` containing "not verified").

#### 🔓 `POST /api/auth/google/`  (Google sign-in)
- **Request:** `{ credential }` — the Google ID token (web sends `credentialResponse.credential` from `@react-oauth/google`). Mobile: obtain `idToken` via `expo-auth-session` and send it as `credential`.
- **Response read:** `response.data.data.access`, `response.data.data.refresh`.
- Error read: `error.response.data.message` / `.error`.

#### 🔓 `POST /api/verify-email/`
- **Request:** `{ email, code }` (`code` is the 6-digit code, `.trim()`ed).
- **Response read:** `response.data.token` (access JWT), `response.data.refresh` (optional), `response.data.message`.
- Errors: 400 missing params; 404 user not found (web redirects to register); 500 server error; else `error.response.data.detail` / `.error`.

#### 🔓 `POST /api/resend-verification/`
- **Request:** `{ email }`.
- **Response read:** none specific (success/failure only). Web enforces a 60s client-side cooldown.

#### 🔓 `POST /api/forgot-password/`
- **Request:** `{ email }`.
- **Response read:** `response.data.message`.

#### 🔓 `POST /api/reset-password/`
- **Request:** `{ token, new_password }` — `token` comes from the reset link URL param.
- **Response read:** `response.data.message`, `response.data.errors.password` (field errors).

#### 🔓 `POST /api/token/refresh/`
- **Request:** `{ refresh }`.
- **Response read:** `response.data.access`. (Web stores it back as the new access token.)

### 2.2 Opportunities & categories

#### 🔓 `GET /api/categories/`
- Sent **twice** by the funds page (intentional): once with `Accept-Language: en` to get canonical `name_en`, once with the current language for display. The web builds a map `translatedName → name_en` so the selected (translated) category can be sent to the opportunities filter as its English name.
- **Response:** paginated `{ results: [ { name, name_en, ... } ] }`.

#### 🔓 `GET /api/opportunities/`
- **Query params (optional):** `category_name=<name_en>` (omitted when "all"); `country=<UAE|Saudi Arabia|USA|UK>` (omitted when "all"). Built with `URLSearchParams`.
- **Response:** paginated `{ results: [Opportunity] }` (see §4.1).

#### 🔓 `GET /api/opportunities/{id}/`
- **Response:** a single `Opportunity` object (full shape, §4.1).
- **Verified live (2026-06-03):** `images[]` = `{ id, image_url, caption_en, caption_ar, is_primary, order }`. `cim_verification`/`cim_rating`/`hcc_insurance` are objects `{ enabled, link (nullable), code, display_text }` (also exposed as flat `*_enabled`/`*_link`/`*_code`). `roi_percentage` is a **string** (e.g. `"18.00"`). Also present: `total_shares`, `purchased_shares`, `account_manager`, `Investement_Cycle` (sic), `*_en`/`*_ar` localized variants of title/description/profit_payment_system. `description` may contain HTML — render safely. Document URLs are Google-Drive share links.

### 2.3 Fees

#### 🔒 `GET /api/fee-percentage/`
- **Response read:** `response.data.fee_percentage` (number; web falls back to `2.5` if it fails).

#### 🔒 `POST /api/investments/calculate-fee/`  *(defined in `feeService` but NOT called by InvestForm — see OQ#3)*
- **Request:** `{ base_amount }`.
- **Response read:** `fee_percentage`, `fee_amount`, `total_amount`.

#### 🔒 `POST /api/investments/validate-fee/`  *(defined in `feeService`, not used in main flow)*
- **Request:** a fee-data object. *(payload not exercised in UI — treat as unused.)*

> **Fee math actually used (local, `FeeService.calculateFeeLocally`):**
> `fee_amount = base_amount * fee_percentage / 100`; `total_amount = base_amount + fee_amount`.
> `base_amount = shares * price_per_share`. Default `fee_percentage = 2.5`.

### 2.4 Investment payment (primary market)

`{opportunityId}` is the opportunity's `id`.

#### 🔒 `POST /api/investments/{opportunityId}/process_paypal_payment/`
- **Request:** `{ orderId, captureId, shares, amount, paymentDetails: { status, payer, capture, create_time, update_time } }`.
- **Response read:** `response.data.status === "success"`. `transactionId` returned to the app is the PayPal `captureId`.

#### 🔒 `POST /api/investments/refund_payment/`
- **Request:** `{ orderId }`. Called only when PayPal processing returns a server (500) error.

#### 🔒 `POST /api/investments/{opportunityId}/process_bank_transfer/`  (multipart)
- **FormData:** `transfer_proof` (File), `reference_number` (string), `amount` (number), `shares` (number).
- **Response read:** `response.data.status === 'success'`; `transaction_id` = `response.data.data.investment_id` ?? `response.data.data.reference_number` ?? `'BANK_TRANSFER'`.

#### 🔒 `POST /api/investments/{opportunityId}/process_crypto_transfer/`  (multipart, manual crypto)
- **FormData:** `transfer_proof` (File), `transaction_hash` (string), `wallet_address` (string), `network` (`BSC`|`Ethereum`|`Solana`), `currency` (`BNB`|`ETH`|`SOL`), `shares` (int), `amount` (string, `toFixed(2)`).
- **Response read:** success if `response.data.status === 'success'` OR `response.data.id` exists; `transaction_id` = `transaction_hash` ?? `transaction_id` ?? `'Pending Verification'`.

#### 🔒 `POST /api/investments/{opportunityId}/process_novapay/`  (multipart)
- **FormData:** `transfer_proof` (File), `reference_number`, `amount`, `shares`.
- **Response read:** `response.data.status === 'success'`; `transaction_id` = `response.data.data.novapay_transfer_id` ?? `investment_id` ?? `reference_number` ?? `'NOVAPAY'`.

#### 🔒 `POST /api/payments/nowpayments/create-invoice/`  (NOWPayments crypto)
- **Request:** `{ opportunityId, shares, amount, success_url, cancel_url }`.
- **Response read:** `response.data.status === 'success'` && `response.data.data.hosted_url`; also `response.data.data.invoice_id` (stored to poll).

#### 🔒 `GET /api/payments/nowpayments/status/{invoiceId}`
- **Response read:** `response.data.completed` (bool). Web polls every 5s, 30-min timeout.

#### 🔒 `POST /api/payments/create-crypto-charge/`  (Coinbase Commerce — present but secondary)
- **Request:** `{ opportunityId, shares, amount, success_url, cancel_url }`.
- **Response read:** `response.data.data.hosted_url`, `response.data.data.charge_id`.

#### 🔒 `GET /api/payments/crypto-status/{chargeId}`
- **Response read:** `response.data.completed`.

### 2.5 Contracts (shared by investment **and** internal-market)

#### 🔒 `POST /api/contracts/create/`
- **Investment request:** `{ contract_type: 'investment', investment_opportunity_id, payment_transaction_id, investment_amount }`.
- **Internal-market request:** `{ contract_type: 'internal_market', market_transaction_id }`.
- **Response read:** `response.data.success` (bool), `response.data.contract_id`.

#### 🔒 `GET /api/contracts/{contractId}/`
- **Response read:** `response.data.contract_summary`, `response.data.contract_html`.

#### 🔒 `POST /api/contracts/{contractId}/sign/`
- **Request:** `{ signature_data }`. `signature_data` is an **object** built by the signature component:
  - Drawn: `{ method: 'drawn', image_data: <dataURL PNG base64>, signed_at, device, screen_size }`.
  - Typed: `{ method: 'typed', typed_name, font: 'cursive', signed_at, device, screen_size }`.
- **Response read:** `response.data.success`. **Idempotency:** an HTTP 400 whose body has `current_status === 'signed'` or `'completed'` is treated as success.

#### 🔒 `GET /api/contracts/user-contracts/`
- **Response read:** `response.data.contracts` (array, see §4.7). Web shows only `status === 'signed'`.

#### 🔒 `GET /api/contracts/{contractId}/download/`
- **Request:** responseType `blob`, with `Authorization` header. Returns a PDF. Errors: 401 expired, 404 not found, 400 must be signed.

### 2.6 Profile / user

#### 🔒 `GET /api/users/me/`
- **Response:** `User/Profile` object (§4.2), including `document_status` sub-object and `user_details`.

#### 🔒 `POST /api/users/complete_profile/`  (multipart, passport upload)
- **FormData:** `phone_number`, `passport_number`, `nationality` (country code), `address`, `profession` (`engineer`|`doctor`|`businessman`|… or null), `custom_profession` (when profession is "other"), `passport_scan` (File — `.pdf/.jpg/.jpeg/.png`, ≤5MB), `documents_submitted_at` (ISO string).
- Mobile file shape: `{ uri, name, type }` appended to FormData as `passport_scan`.

### 2.7 Wallet

#### 🔒 `GET /api/wallet/`
- **Response:** paginated `{ results: [wallet] }`; web uses `results[0]`.

#### 🔒 `GET /api/wallet/summary/`
- **Response read (merged into wallet state):** `balance`, `profit_balance`, `total_balance`, `last_profit_date` (§4.3).

#### 🔒 `GET /api/wallet/transactions/`
- **Response:** paginated `{ results: [Transaction] }` (§4.4). Web falls back to `[]`.

#### 🔒 `GET /api/wallet/withdrawals/`
- **Response:** paginated `{ results: [Withdrawal] }` (§4.5). Web falls back to `[]`.

#### 🔒 `POST /api/wallet/withdraw/`
- **Request:** `{ amount, withdraw_profit_only (bool), bank_name, account_number, account_holder_name, swift_code, iban }`.
- **Response read:** `response.data.status === 'success'`, `response.data.message`.
- **Errors:** `err.response.data.errors` (field→array). Special: if `errors.amount` includes `"Insufficient total balance"` → show the dedicated insufficient-balance message.

### 2.8 Portfolio

#### 🔒 `GET /api/portfolio/my-portfolio/`
- **Query:** `{ months }` (web default 24).
- **Response read:** `response.data.success`, and `response.data.portfolio_data` (§4.6: `chart_data`, `current_stats`, `data_points`).

#### 🔒 `POST /api/portfolio/refresh/`
- **Request:** none. Recomputes the caller's portfolio; web then refetches `my-portfolio`.

> Admin variants (`GET /api/portfolio/{investorId}/`, `POST /api/portfolio/{investorId}/refresh/`) exist in `portfolioService` but are **out of scope** for the investor app.

### 2.9 Investments (mine)

#### 🔒 `GET /api/investments/my_investments/`
- **Response:** an **array** of investment groups (used directly in `.map`/`.reduce`). Each item shape in §4.8.

### 2.10 Internal market (secondary market)

#### 🔒 `GET /api/internal-market/listings/`
- **Response read:** `response.data.listings` (array). Fields per item: `listing_id`, `project_name`, `seller_id`, `shares_to_sell`, `asking_price_per_share`.

#### 🔒 `GET /api/internal-market/holdings/`
- **Response read:** `response.data.holdings` (array). See `Holding` shape §4.9.

#### 🔒 `GET /api/internal-market/user-listings/`
- **Response read:** `response.data.listings` (array). Per item: `listing_id`, `project_name`, `shares_to_sell`, `asking_price_per_share`, `status`, `created_at`.

#### 🔒 `GET /api/internal-market/transactions/`
- **Response read:** `response.data.transactions` (array). Per item: `transaction_id`, `transaction_type` (`purchase`|`sold`), `shares`, `total_amount`, `project_name`, `completed_at`.

#### 🔒 `GET /api/internal-market/statistics/`
- **Response read:** `response.data.statistics` = `{ total_listings, total_volume, average_price, active_traders }`.

#### 🔒 `POST /api/internal-market/create-listing/`  (SELL)
- **Request:** `{ investment_id, shares_to_sell (int), asking_price_per_share (float), listing_type ('normal'|'fast') }`.
- `investment_id` comes from the chosen `holding.investment_id`.
- **Validation (client):** shares > 0, price > 0, `shares_to_sell ≤ holding.shares_available_for_sale`. Only offered when `holding.can_sell_shares === true`.

#### 🔒 `POST /api/internal-market/purchase/`  (BUY)
- **Request:** `{ listing_id, shares (int), payment_method ('wallet'|'bank_transfer'|'credit_card'|'crypto') }`.
- **Response read:** `response.data.success`, `response.data.payment.status` (e.g. `'completed'`), `response.data.transaction.transaction_id`, and on the success screen `response.data.summary` (`transaction_id`, `seller_info.project`, `seller_info.seller_id`, `shares_purchased`, `price_per_share`, `subtotal`, `platform_fee`, `platform_fee_percentage`, `total_paid`, `payment_method`, `payment_status`, `wallet_balance_after?`, `completed_at`).

#### 🔒 `POST /api/internal-market/paypal-complete/`
- **Request:** `{ transaction_id, orderId, captureId, paymentStatus }`.
- **Response read:** `response.data.success`, `response.data.transaction.transaction_id`.

#### 🔒 `POST /api/internal-market/bank-transfer-upload/`  (multipart)
- **FormData:** `transaction_id`, `reference_number`, `transfer_proof` (File).
- **Response read:** `response.data.success`.

### 2.11 Documents & misc

#### 🔒 `GET /api/documents/`
- **Response:** paginated `{ results: [Document] }` (§4.10).

#### 🔒 `POST /api/feedback/`
- **Request:** `{ email, subject, message, email_to: 'contact@capimaxinvestment.com', user_email }` (web hardcodes `email_to`; `email`/`user_email` come from `users/me` → `user_details.email`).
- **Response read:** `response.data.status` (`'success'`/`'error'`), `response.data.message`.

#### 🔒 `GET /api/users/me/` (reused by legal/policy pages)
- Legal page reads `response.data.statement_url`; policy-insurance page reads `response.data.policy_insurance_url` (open the URL externally).

---

## 3) Multi-step flows (exact, as implemented in the web)

### Flow A — Authentication / Login
1. Submit `POST /api/user/token/` with `{ email, password }`.
2. If `response.data.data.is_verified === false` **or** `response.data.error === "Account not verified"`:
   - (Optionally trigger `POST /api/resend-verification/` with `{ email }`.)
   - Navigate to verify-email with `{ email, isVerified:false, redirectUrl:'/funds' }`. **Stop.**
3. Else if `response.data.data.access` exists:
   - Store `access` and `refresh` (mobile: `SecureStore`).
   - Read intended route (`redirectUrl`, default `/funds` → mobile `/(tabs)/funds`), then clear it, and navigate there (replace).
4. Catch: if `error.response.data.error === "Account not verified"` → go to verify-email.
- **Client-side password rules (register & reset):** ≥8 chars, ≥1 uppercase, ≥1 digit, ≥1 special char.
- **Token refresh (ProtectedRoute):** decode access JWT `exp`; if `exp < now`, call `POST /api/token/refresh/` with `{ refresh }`; on 200 store new `access`; on failure → unauthorized → login.
- **"Return to intended route":** web sets `localStorage.redirectUrl = currentPath` before bouncing to login (e.g. when an unauthenticated user taps Invest). Mobile keeps the intended route in state and returns to it after login (CLAUDE.md §6).

### Flow B — Register → Verify
1. `POST /api/user/register/` `{ username, email, password }` (validate password client-side first).
2. On `response.data.success !== false` → navigate to verify-email with `{ email, isVerified:false }`.
3. Verify screen: user enters 6-digit `code` → `POST /api/verify-email/` `{ email, code }`.
4. If `response.data.token` → store it as access (and `response.data.refresh` if present). Navigate to `redirectUrl` (default login).
5. Resend: `POST /api/resend-verification/` `{ email }` (60s cooldown).

### Flow C — Forgot / Reset password
1. Forgot: `POST /api/forgot-password/` `{ email }` → show success (email sent with link containing a token).
2. Reset (from link `/reset-password/:token`): validate password rules + confirm match → `POST /api/reset-password/` `{ token, new_password }` → on success navigate to login.

### Flow D — Investment (4 steps) — `components/Forms/InvestForm.jsx`
**Step 0 — Gate (auth + profile):**
1. Require an access token; if absent, save intended route and send to login (Flow A return).
2. `GET /api/users/me/`; investment requires `document_status.has_passport === true`. If incomplete → open profile completion (Flow H) / route to edit-profile.
3. Require terms accepted (checkbox).

**Step 1 — Create / amount:**
4. `GET /api/fee-percentage/` → `fee_percentage` (default 2.5).
5. `base_amount = shares * price_per_share`; `fee_amount = base*pct/100`; `total = base + fee` (local calc).
6. *(No standalone "create investment" call — the investment record is created server-side by the payment endpoint.)*

**Step 2 — Payment** (one method; all return a `transaction_id`):
- PayPal → `process_paypal_payment/` (success when `status==="success"`; on 500 → `refund_payment/`).
- Bank → `process_bank_transfer/` (multipart) → status `Processing`.
- Crypto manual → `process_crypto_transfer/` (multipart) → status `Pending Verification`.
- NovaPay → `process_novapay/` (multipart) → status `Processing`.
- NOWPayments → `create-invoice/` → open `hosted_url` (mobile: WebView / `expo-web-browser`) → poll `status/{invoiceId}` until `completed`.

**Step 3 — Contract:**
7. `POST /api/contracts/create/` `{ contract_type:'investment', investment_opportunity_id, payment_transaction_id: <transaction_id>, investment_amount: total }` → `contract_id`.
8. `GET /api/contracts/{contract_id}/` → render `contract_html` (mobile: WebView) + show `contract_summary`.
9. Sign pad → `POST /api/contracts/{contract_id}/sign/` `{ signature_data }` (drawn/typed object). 400-with-`current_status` signed/completed counts as success.

**Step 4 — Complete:**
10. Navigate to payment-success with the transaction details. User then visits MyFunds/Wallet to see updated data (no implicit refetch on the success screen).

### Flow E — Internal-market SELL (create listing) + the 90-day rule
**Where the 90-day rule lives:** the backend computes it and returns flags on each holding; the web does **not** call any extra endpoint to evaluate it. The relevant holding fields are `can_sell_shares` (bool), `days_until_can_sell` (int), `first_purchase_date` (ISO), `shares_available_for_sale`, `shares_currently_listed`, `total_shares_owned`.

**Sell-eligibility decision (from `pages/myfunds` `getSellStatus`, in priority order):**
1. **`no_internal_market`** — no holding exists for this opportunity (`holdings.find(h => h.investment_opportunity.id === opportunityId)` is undefined) → cannot sell.
2. **`holding_period`** — `holding.can_sell_shares === false` → cannot sell yet. Web also computes a display date `eligibleDate = first_purchase_date + 90 days` (`90*24*60*60*1000` ms) and shows `days_until_can_sell` remaining. **The 90 is a client-side display constant; the authoritative gate is the backend's `can_sell_shares`/`days_until_can_sell`.**
3. **`no_available_shares`** — `holding.shares_available_for_sale <= 0` (often because `shares_currently_listed > 0`) → cannot sell.
4. **`available`** — otherwise → can sell; shows `shares_available_for_sale` of `total_shares_owned`.

**Sell action:** when `available`, MyFunds navigates to the market with `createListing=true&opportunityId=…&opportunityTitle=…`. In the market, the **Create Listing** dialog (only shown when `holding.can_sell_shares === true`) collects `listing_type` (`normal` = up to 30 days, 2% fee; `fast` = immediate, ~5–10% discount + 5% fee), `shares_to_sell` (≤ `shares_available_for_sale`), `asking_price_per_share`, then `POST /api/internal-market/create-listing/` `{ investment_id, shares_to_sell, asking_price_per_share, listing_type }`. On success the web reloads the page.

> Listing financial preview (client-side, for display only):
> - Normal: `total = shares*price`; `fee = total*0.02`; `net = total - fee`.
> - Fast: `total = shares*price`; `discount = total*0.075`; `discounted = total - discount`; `fee = discounted*0.05`; `net = discounted - fee`.

### Flow F — Internal-market BUY (purchase)
1. Pick a listing → choose `shares` (≤ `shares_to_sell`) and `payment_method`.
2. `POST /api/internal-market/purchase/` `{ listing_id, shares, payment_method }` → `{ success, payment.status, transaction.transaction_id }`.
3. Branch by method:
   - **wallet:** if `success && payment.status === 'completed'` → create contract (step 5) immediately.
   - **bank_transfer:** go to bank-upload screen → `POST /api/internal-market/bank-transfer-upload/` multipart `{ transaction_id, reference_number, transfer_proof }`. (Payment then pending verification; web reloads.)
   - **credit_card:** open PayPal gateway → on capture, `POST /api/internal-market/paypal-complete/` `{ transaction_id, orderId, captureId, paymentStatus }` → then create contract.
   - **crypto:** open NOWPayments gateway → on success → create contract.
4. **Contract (non-bank paths):** `POST /api/contracts/create/` `{ contract_type:'internal_market', market_transaction_id }` → `GET /api/contracts/{id}/` → `POST /api/contracts/{id}/sign/` `{ signature_data }`.
5. Success screen reads `response.data.summary` (see §2.10).

### Flow G — Withdraw — `pages/wallet/WithdrawForm.jsx`
1. Fill `{ amount, withdraw_profit_only, bank_name, account_number, account_holder_name, swift_code, iban }`.
2. `POST /api/wallet/withdraw/`.
3. On `status === 'success'`: wait ~1.5s, close modal, **refetch** wallet (`/api/wallet/summary/`, `/transactions/`, `/withdrawals/`).
4. On error: map `response.data.errors[field][0]` to fields; if `errors.amount` mentions `"Insufficient total balance"` → show the insufficient-balance message.

### Flow H — Profile completion (passport) — `pages/edit/index.jsx`
1. `GET /api/users/me/` to prefill.
2. Submit multipart `POST /api/users/complete_profile/` with the §2.6 fields incl. `passport_scan` file (mobile: `expo-image-picker`/`expo-document-picker` → `{ uri, name, type }`). Validate file type & ≤5MB client-side; set `documents_submitted_at` when the file is chosen.
3. Success → `document_status.has_passport` becomes true (unblocks investing).

---

## 4) Key data-entity shapes (fields the web actually reads)

> These are the field names accessed in the web; types are inferred from usage.
> Treat any field the web doesn't read as "may exist but unverified".

### 4.1 Opportunity
```
id, title, title_en, title_ar,
description, description_en, description_ar  (MAY contain HTML → render safely),
status (e.g. "ACTIVE"), country (e.g. "UAE"),
cover_image_url, available_shares (number), total_shares, purchased_shares,
price_per_share (STRING, e.g. "5000.00" → parseFloat),
contract_type (e.g. "closed"), insurance (bool),
total_investment (STRING/number), duration (months, number),
roi_percentage (STRING, e.g. "18.00" → Number; nullable),
profit_payment_system (+ _en/_ar, nullable), minimum_shares, code (asset code, e.g. "T7MW3JS4"),
account_manager, Investement_Cycle (sic — backend typo, use the key AS-IS),
category: { id, name, name_en, name_ar, ... },
created_at, updated_at,
cim_verification: { enabled, display_text, link (nullable), code },   // also flat cim_verification_enabled/_link/_code
cim_rating:       { enabled, display_text, link (nullable), code },   // also flat cim_rating_*
hcc_insurance:    { enabled, display_text, link (nullable), code },   // also flat hcc_insurance_*
request_copy_url, investement_offer_copy_url, acceptance_investement_offer_copy_url,
investement_document_contract_summary_url, agency_based_investement_agreement_url,
investement_agreement_url,                                            // (all Google-Drive share links)
images: [ { id, image_url, caption_en, caption_ar, is_primary, order } ]   // sort: is_primary first, then order
```
> **Type warning (verified live):** `price_per_share`, `roi_percentage`, `total_investment` come back
> as **strings** — `parseFloat`/`Number` before math/formatting. `images[]` is a real gallery.

**Document URL → display-label mapping** (mobile detail page, web labels):
| field | i18n key (`opportunity.*`) | en label |
|---|---|---|
| `request_copy_url` | `requestForm` | Capimax agreement |
| `investement_offer_copy_url` | `investmentOffer` | Insurance agreement |
| `acceptance_investement_offer_copy_url` | `investmentOfferAcceptance` | Evaluation report |
| `investement_document_contract_summary_url` | `investmentContractSummary` | Shareholder agreement |
| `agency_based_investement_agreement_url` | `agencyBasedInvestmentAgreement` | Presentation |
| `investement_agreement_url` | `investmentAgreement` | Other |

Card badges/fields: `status`, CIM Verified/Rated (from `cim_verification`/`cim_rating`), HCC Insured (`hcc_insurance`), `country`, `available_shares`, `price_per_share`, `contract_type`, `insurance`, `cover_image_url`.

### 4.2 User / Profile  (`GET /api/users/me/`)
```
id, username, email, phone_number, passport_number, nationality (country code),
address, profession, custom_profession, created_at, updated_at, documents_submitted_at,
user_details: { username, email },
document_status: {
  verification_status: 'verified' | 'pending' | 'not_submitted',
  has_passport (bool),
  documents_verified_at (nullable),
  verification_notes (nullable)
},
statement_url (nullable), policy_insurance_url (nullable)
```

### 4.3 Wallet summary
```
balance, profit_balance, total_balance, last_profit_date
```
(plus the base wallet object from `GET /api/wallet/` `results[0]`.)

### 4.4 Wallet transaction
```
id, created_at, type, amount, description
```

### 4.5 Withdrawal
```
id, created_at, amount, bank_name,
status: 'pending'|'completed'|'failed'|'processing'
```
Status colors: pending=warning, completed=success, failed=error, processing=info.

### 4.6 Portfolio (`portfolio_data`)
```
chart_data: {
  labels: string[],
  invested_capital: number[],
  total_value: number[],
  growth_amount: number[],
  growth_percentage: number[],
  monthly_growth_rates: number[]
},
current_stats: {
  total_invested, total_value, total_growth, growth_percentage,
  average_monthly_return, best_month_return, worst_month_return
},
data_points: number
```

### 4.7 Contract (user-contracts item)
```
contract_id, title (nullable), contract_type, total_amount,
status (web shows only 'signed'), created_at, signed_at (nullable)
```
Download URL pattern: `/api/contracts/{contract_id}/download/` (PDF blob).
Contract detail (`GET /api/contracts/{id}/`): `contract_summary`, `contract_html`.

### 4.8 Investment group (`my_investments` item)
```
opportunity: { id, title, status, price_per_share, contract_type, duration },
total_amount_invested,
investments: [ { id, shares_purchased, amount_invested, created_at } ]
```
MyFunds total = `sum(item.total_amount_invested)`.

### 4.9 Holding (internal-market)
```
id, investment_id,
investment_opportunity: { id, title },
total_shares_owned, shares_available_for_sale, shares_currently_listed,
original_purchase_price_per_share,
can_sell_shares (bool), days_until_can_sell (int), first_purchase_date (ISO)
```

### 4.10 Document (`/api/documents/` item)
```
id, name, created_at, document_url
```

### 4.11 Internal-market listing
- Market listing: `listing_id, project_name, seller_id, shares_to_sell, asking_price_per_share`.
- My listing: `listing_id, project_name, shares_to_sell, asking_price_per_share, status, created_at`.

### 4.12 Internal-market transaction
```
transaction_id, transaction_type ('purchase'|'sold'), shares, total_amount,
project_name, completed_at
```

### 4.13 Internal-market statistics
```
total_listings, total_volume, average_price, active_traders
```

---

## 5) Theme tokens — light (Stake) + dark (navy + green) — full spec in DESIGN.md & CLAUDE.md §9

**Source of truth:** `src/theme/palettes.js` (colors) + `src/theme/tokens.js` (spacing/radii/type/
motion/elevation) via `useTheme()`. Components never import colors statically. Mode
`auto`/`light`/`dark` persisted in AsyncStorage; live re-render. **Rule #4:** content on a `primary`
(#2ead6f) fill is always `onPrimary` (#0b2928), never white. Elevation: shadow (light) / surface +
hairline border (dark).

- **DARK (navy):** `bg #121c30 · surface #1a2942 · surfaceAlt #223457 · card #18243c · border rgba(255,255,255,.10) · borderStrong rgba(255,255,255,.18) · primary #2ead6f · primaryLight #54c98a · primaryDark #1f8a54 · onPrimary #0b2928 · text #FFFFFF · textSecondary #9fb0c9 · textMuted #6b7a93 · positive #3ddb86 · negative #ff6b6b · warning #FFA726 · error #f44336 · info #2196F3`.
- **LIGHT (Stake):** `bg #F4F7F5 · surface #FFFFFF · surfaceAlt #EEF3F0 · card #FFFFFF · border rgba(11,41,40,.08) · borderStrong rgba(11,41,40,.14) · primary #2ead6f · primaryLight #54c98a · primaryDark #1f8a54 · onPrimary #0b2928 · text #0b2928 · textSecondary #5a7a72 · textMuted #93aaa3 · positive #1f9d5f · negative #d64545 · warning #E08600 · error #d32f2f · info #1976D2`.

---

## 6) Open questions

> **Owner-reviewed 2026-06-03.** Resolutions below are binding decisions for the mobile build.

1. ✅ **RESOLVED.** Treat `POST /api/auth/google/`, `/api/forgot-password/`, `/api/reset-password/`, `/api/token/refresh/` as **public** (no `Authorization`). A 401/403 on any of them must **not** force logout. (Mobile client public-endpoint list includes these in addition to the web's regex list.)
2. ⏳ **DEFERRED (do not block, do not invent).** `pages/change-password` is UI-only with no endpoint in the web. The real change-password endpoint/payload will be **provided by the owner before Phase 8**. Until then, do not build or guess it.
3. ✅ **RESOLVED.** Use **local fee math** to match web: `fee = base * pct / 100`, `total = base + fee`; `pct` from `GET /api/fee-percentage/` (default `2.5`). Do **not** call `calculate-fee` / `validate-fee`.
4. ✅ **RESOLVED.** Handle the per-endpoint token envelope exactly as documented: login & Google → `response.data.data.access`/`.refresh`; verify-email → `response.data.token`; refresh → `response.data.access`.
5. ✅ **RESOLVED.** Rely **solely on backend** `can_sell_shares` / `days_until_can_sell` for sell eligibility. The `90*24h` math is **display-only**.
6. ✅ **RESOLVED.** `GET /api/wallet/summary/` is **authoritative** for `balance`/`profit_balance`/`total_balance`/`last_profit_date`. Still fetch `GET /api/wallet/` for the base object (as the web does).
7. ✅ **RESOLVED.** Build against the documented listing schemas (market `listings` → `seller_id`; `user-listings` → `status`/`created_at`). **Verify against live responses in Phase 7.**
8. ⏳ **DEFERRED — match web for now.** Bank/crypto-manual/NovaPay stay pending with no client polling; **no auto-contract for bank transfer** (web creates the contract only on wallet/paypal/crypto-gateway paths). Owner will confirm the verification behavior before Phase 4 is finalized.
9. ✅ **RESOLVED.** Use **NOWPayments only**. Treat Coinbase (`create-crypto-charge` / `crypto-status`) as **unused — do not build it**.
10. ⏳ **DEFERRED.** Google OAuth client IDs (iOS/Android/web) to be **provided by owner for Phase 2**. If not ready, build email/password auth first and add Google later. (`POST /api/auth/google/` contract unchanged.)
11. ✅ **RESOLVED.** PayPal on mobile via a **WebView-hosted PayPal SDK** page reusing the same **live client id**; the same `process_paypal_payment` / `paypal-complete` payloads apply.
