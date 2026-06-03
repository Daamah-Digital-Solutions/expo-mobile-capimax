# BUILD_PLAN.md — CapiMax Mobile, phased roadmap

> How to use: for each phase, paste the "Ready prompt" into Claude Code.
> When it finishes, check the Definition of Done before saying "continue to the next phase".
> **`git commit` after every phase.**

---

## Steering principles (how to drive Claude Code well)

1. **One phase at a time.** Never say "build the whole app". One-shotting it yields mediocre output.
2. **Working skeleton before completeness.** First goal: app opens + login + one real screen. Then expand.
3. **Test against the real backend after each phase.** Log in with a real account and verify data loads.
4. **Pin it to its own analysis.** If it tries to invent an endpoint, send it back to `API_AND_FLOWS.md`.
5. **Ask for screenshots/descriptions** after each phase to review quality.
6. **No mock.** Any fabricated number = phase rejected.
7. **Commit + clear message** at the end of every phase.

> Keep `CLAUDE.md` and `BUILD_PLAN.md` in the repo root from the start, and make the web project
> available to Claude Code (a sibling folder or same repo) so it can read the original code on demand.

---

## Phase 0 — Full analysis & scaffold

**Goal:** Claude Code understands the project by itself, produces the API/flows inventory, and sets
up an empty Expo app that opens.

**Ready prompt:**
```
I have a web dashboard for an investment platform called CapiMax (React + Vite) located here: <PATH>.
We will build a React Native + Expo mobile app from it that uses the SAME backend and the SAME flows.

First, read these files fully and follow them literally:
- CLAUDE.md (fixed rules and decisions)
- BUILD_PLAN.md (the plan — we are on Phase 0)

Phase 0 only:
1) Analyze the ENTIRE web project yourself and produce a file API_AND_FLOWS.md in the repo root that
   lists: every screen + route; every API endpoint (method, path, auth?, request payload, response
   shape); the exact multi-step flows (auth, investment 4-step, internal-market sell with the 90-day
   holding logic, withdraw, profile completion); and key data-entity shapes (opportunity, user/profile,
   wallet summary, investment group, holding). This file becomes our API contract — do NOT invent
   anything not derived from the actual code. If anything is ambiguous, list it as an open question.
2) Confirm the backend base URL from the web env config.
3) Scaffold an Expo (SDK 51) project with expo-router and the stack in CLAUDE.md §3
   (package.json, app.json, babel.config). Put the base URL in app.json extra.apiUrl.
4) Make the app open on a temporary "Hello CapiMax" screen using the correct dark theme.
Do NOT build any real screen yet. When done, commit and ask me to review API_AND_FLOWS.md.
```

**Definition of Done:**
- `npx expo start` runs and the app opens on device/simulator.
- `API_AND_FLOWS.md` exists, derived from the code, covering all screens/flows/endpoints.
- No invented endpoints; open questions are listed.

---

## Phase 1 — Foundation

**Goal:** API client + Auth + i18n/RTL + Theme + navigation skeleton.

**Ready prompt:**
```
Phase 1 — foundation only:
1) src/api/client.js: an axios instance mirroring the web's src/api/api.js (Accept-Language header,
   public-endpoints list, token from expo-secure-store, 401/403 interceptor that logs out via
   AuthContext). baseURL from app.json extra.apiUrl.
2) src/api/services.js: functions for every endpoint in API_AND_FLOWS.md, grouped by domain.
3) src/context/AuthContext.jsx: session state, login/logout/refresh, tokens in SecureStore, and the
   exact login flow from API_AND_FLOWS.md (is_verified handling, redirect, token storage).
4) src/theme/colors.js from CLAUDE.md §9.
5) i18n: react-i18next + copy both translation files from public/locales/{en,ar}/translation.json into
   src/locales. Enable RTL for Arabic.
6) Navigation: app/_layout.jsx (Providers + auth gate), an (auth) stack, and empty (tabs) bottom tabs
   (Funds, MyFunds, Wallet, Portfolio, Market, More) with icons and translated labels (placeholder content).
No real screens yet beyond the above. Verify tabs render correctly in both Arabic and English.
Commit and ask me to review.
```

**Definition of Done:** app distinguishes logged-in/out and routes correctly; tabs show translated
labels in both languages (RTL ok); client + services + AuthContext ready (even if screens are empty).

---

## Phase 2 — Full authentication

**Ready prompt:**
```
Phase 2 — full auth screens wired to the real backend:
login (email+password + client-side password validation), register, verify-email (with resend),
forgot-password, reset-password. Implement the exact login flow (is_verified, redirect, token storage).
Add Google sign-in via expo-auth-session and send the idToken as `credential` to /api/auth/google/
(if you need Google client ids for iOS/Android, ask me).
Every screen: loading/error states + translations + RTL + the dark card styling.
Test with a real account. Commit and ask me to review.
```

**Definition of Done:** I can log in with a real account and reach the tabs; register routes to
verify; forgot/reset password work.

---

## Phase 3 — Funds + Opportunity detail

**Ready prompt:**
```
Phase 3 — available assets screen and opportunity detail:
- (tabs)/funds: opportunities counter + category filter (use the English name, name_en) + country
  filter, and opportunity cards with ALL fields and badges (status, available_shares, price_per_share,
  contract_type, insurance, country, CIM Verified/Rated, HCC Insured, cover_image_url).
- opportunity/[id]: the full detail page (read views/OpportunityDetailPage in the web and match it).
The "Invest" button routes to /invest/[id] (if not logged in, save the route, go to login, then return).
Zero mock. loading/empty/error + RTL. Commit and ask me to review.
```

**Definition of Done:** real opportunities render, filters work, detail is complete, invest button routes correctly.

---

## Phase 4 — Invest + Payment + Contract (hardest phase)

**Ready prompt:**
```
Phase 4 — the full 4-step investment flow (read components/Forms/InvestForm.jsx in the web and match the logic):
1) Create investment: share selection + base/fee/total calculation (rate from /api/fee-percentage/),
   and ensure the profile is complete (users/me); if incomplete, open profile completion.
2) Payment: paypal / bank / crypto-manual / nowpayments — implement the mobile approach in CLAUDE.md §7
   (PayPal/NOWPayments inside WebView/web-browser). Return a transaction_id.
3) Contract: contracts/create → contracts/:id/ (render contract_html in WebView) → sign (signature pad)
   → contracts/:id/sign.
4) Complete: success screen + refresh MyFunds/Wallet.
If any payment key is missing, ask me. Test with a small amount if possible. Commit and ask me to review.
```

**Definition of Done:** I can complete a full investment cycle (at least until the backend needs real
payment data); the contract renders and is signed.

---

## Phase 5 — Wallet + Withdraw

**Ready prompt:**
```
Phase 5 — wallet: 3 balance cards (balance, profit_balance, total_balance + last_profit_date), tabs for
transactions and withdrawals with all fields and status colors, and the withdraw form (modal) with all
fields (amount, withdraw_profit_only, bank_name, account_number, account_holder_name, swift_code, iban)
and the "insufficient balance" error handling. After a successful withdrawal, refetch the data.
RTL + states. Commit and ask me to review.
```

**Definition of Done:** real balances show, transactions/withdrawals show, withdrawal works and refreshes.

---

## Phase 6 — MyFunds + Portfolio

**Ready prompt:**
```
Phase 6:
- (tabs)/myfunds: my investments grouped (investments/my_investments) + total + document status (users/me)
  + the "Sell" button logic based on holdings (90-day period and all states in API_AND_FLOWS.md). The sell
  button opens create-listing in the market.
- (tabs)/portfolio: portfolio/my-portfolio (months) + cards (invested/growth/total) + a chart
  (victory-native or gifted-charts) + a Refresh button (portfolio/refresh). RTL + states.
Commit and ask me to review.
```

**Definition of Done:** real investments + correct sell logic + performance chart works.

---

## Phase 7 — Internal Market

**Ready prompt:**
```
Phase 7 — the full internal market (read pages/internal-market in the web):
available listings, my holdings, my listings (user-listings), transactions, statistics, create a sell
listing (create-listing), purchase (purchase + paypal-complete + bank-transfer-upload). Match all tabs
and flows. RTL + states. Commit and ask me to review.
```

**Definition of Done:** I can browse listings, create a sell listing, and start a purchase — all with real data.

---

## Phase 8 — Account + Edit + Change password

**Ready prompt:**
```
Phase 8:
- account: full user profile + document verification status (users/me) — match pages/account.
- edit-profile: form (phone_number, passport_number, nationality, address, profession, custom_profession)
  + passport_scan upload via expo-image-picker as multipart to users/complete_profile.
- change-password: match pages/change-password in the web.
RTL + states + success/error messages. Commit and ask me to review.
```

**Definition of Done:** profile shows and edits, passport upload works, change password works.

---

## Phase 9 — Support / FAQ / Legal / Settings

**Ready prompt:**
```
Phase 9:
- contact: contact/request form (feedback or the same web form).
- faq: from faq.* translation keys.
- legal/[type]: privacy (policyInsurance), terms (statement/legal), terms-conditions — text from translations.
- document-center: from /api/documents/.
- a More/Settings screen: language switch (ar/en + RTL), app info, logout.
RTL + states. Commit and ask me to review.
```

**Definition of Done:** every web sidebar screen exists and works; language switching is smooth.

---

## Phase 10 — Polish + QA + Build

**Ready prompt:**
```
Phase 10 — final polish:
1) Review every screen against the Definition of Done in CLAUDE.md §10 and fix any gaps.
2) Consolidate shared components (Card/Button/StatBox/Chip/EmptyState/Field) where duplicated.
3) Add: pull-to-refresh, loading skeletons, offline handling, a generic error screen.
4) Review RTL on every screen + spacing/typography/shadows (premium feel).
5) App icon + splash + CapiMax name.
6) Set up an EAS build (eas.json) for Android (APK/AAB) and iOS, and explain the publishing steps.
Give me a report of anything missing or needing keys from me.
```

**Definition of Done:** the app is professional, all screens complete, and a build is installable.

---

## Final checklist before "we're done"

- [ ] Every endpoint in `API_AND_FLOWS.md` is used in its correct place.
- [ ] Zero mock data anywhere in the app.
- [ ] The 4-step investment flow works end-to-end.
- [ ] Internal-market (90-day) logic is correct.
- [ ] RTL is correct on every screen.
- [ ] Loading/Empty/Error on every screen.
- [ ] Tokens in SecureStore, and 401 logs out correctly.
- [ ] Build runs on a real device (Android + iOS).
