// All API calls, grouped by domain. Every function maps to an endpoint documented in
// API_AND_FLOWS.md §2. Do NOT add an endpoint here that isn't in that contract.
//
// These are thin wrappers returning the axios promise; screens/contexts handle the
// exact response-envelope reads (e.g. login's data.data.access) per the contract.
import api from "./client";

const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };

// ───────────────────────── Auth (§2.1) ─────────────────────────
export const authService = {
  // POST /api/user/register/  →  { success, message, errors }
  register: ({ username, email, password }) =>
    api.post("/api/user/register/", { username, email, password }),

  // POST /api/user/token/  →  data.data.{ is_verified, access, refresh, email }, data.error
  login: ({ email, password }) => api.post("/api/user/token/", { email, password }),

  // POST /api/auth/google/  →  data.data.{ access, refresh }   (credential = Google idToken)
  google: (credential) => api.post("/api/auth/google/", { credential }),

  // POST /api/verify-email/  →  data.{ token, refresh?, message }
  verifyEmail: ({ email, code }) =>
    api.post("/api/verify-email/", { email, code }),

  // POST /api/resend-verification/
  resendVerification: (email) => api.post("/api/resend-verification/", { email }),

  // POST /api/forgot-password/  →  data.message
  forgotPassword: (email) => api.post("/api/forgot-password/", { email }),

  // POST /api/reset-password/  →  data.{ message, errors? }
  resetPassword: ({ token, new_password }) =>
    api.post("/api/reset-password/", { token, new_password }),

  // POST /api/token/refresh/  →  data.access
  refresh: (refresh) => api.post("/api/token/refresh/", { refresh }),
};

// ──────────────────── Opportunities & categories (§2.2) ────────────────────
export const opportunityService = {
  // GET /api/categories/ — called twice by the web (en + current lang) to map names.
  getCategories: (acceptLanguage) =>
    api.get("/api/categories/", acceptLanguage ? { headers: { "Accept-Language": acceptLanguage } } : undefined),

  // GET /api/opportunities/?category_name=<name_en>&country=<country>  (params optional)
  getOpportunities: ({ categoryName, country } = {}) => {
    const params = new URLSearchParams();
    if (categoryName && categoryName !== "all") params.append("category_name", categoryName);
    if (country && country !== "all") params.append("country", country);
    const qs = params.toString();
    return api.get(qs ? `/api/opportunities/?${qs}` : "/api/opportunities/");
  },

  // GET /api/opportunities/:id/
  getOpportunity: (id) => api.get(`/api/opportunities/${id}/`),
};

// ───────────────────────── Fees (§2.3) ─────────────────────────
// OQ#3 resolved: use local math; only fetch the percentage.
export const feeService = {
  // GET /api/fee-percentage/  →  data.fee_percentage (default 2.5)
  getFeePercentage: () => api.get("/api/fee-percentage/"),
};

export const DEFAULT_FEE_PERCENTAGE = 2.5;

// fee = base * pct / 100 ; total = base + fee
export function calculateFee(baseAmount, feePercentage = DEFAULT_FEE_PERCENTAGE) {
  const base = Number(baseAmount) || 0;
  const pct = Number(feePercentage) || DEFAULT_FEE_PERCENTAGE;
  const fee_amount = (base * pct) / 100;
  return {
    base_amount: base,
    fee_percentage: pct,
    fee_amount,
    total_amount: base + fee_amount,
  };
}

// ─────────────────── Investment payments (§2.4) ───────────────────
export const investmentPaymentService = {
  processPaypal: (opportunityId, payload) =>
    api.post(`/api/investments/${opportunityId}/process_paypal_payment/`, payload),

  refundPayment: (orderId) =>
    api.post("/api/investments/refund_payment/", { orderId }),

  processBankTransfer: (opportunityId, formData) =>
    api.post(`/api/investments/${opportunityId}/process_bank_transfer/`, formData, MULTIPART),

  processCryptoTransfer: (opportunityId, formData) =>
    api.post(`/api/investments/${opportunityId}/process_crypto_transfer/`, formData, MULTIPART),

  processNovaPay: (opportunityId, formData) =>
    api.post(`/api/investments/${opportunityId}/process_novapay/`, formData, MULTIPART),

  // NOWPayments (the only crypto gateway we build — OQ#9)
  createNowPaymentsInvoice: (payload) =>
    api.post("/api/payments/nowpayments/create-invoice/", payload),
  getNowPaymentsStatus: (invoiceId) =>
    api.get(`/api/payments/nowpayments/status/${invoiceId}`),
};

// ─────────────────── Contracts (§2.5, shared) ───────────────────
export const contractService = {
  // contract_type: 'investment' | 'internal_market'
  create: (payload) => api.post("/api/contracts/create/", payload),
  get: (contractId) => api.get(`/api/contracts/${contractId}/`),
  sign: (contractId, signatureData) =>
    api.post(`/api/contracts/${contractId}/sign/`, { signature_data: signatureData }),
  userContracts: () => api.get("/api/contracts/user-contracts/"),
  download: (contractId) =>
    api.get(`/api/contracts/${contractId}/download/`, { responseType: "blob" }),
};

// ───────────────────────── Profile (§2.6) ─────────────────────────
export const userService = {
  // GET /api/users/me/
  me: () => api.get("/api/users/me/"),
  // POST /api/users/complete_profile/  (multipart, includes passport_scan)
  completeProfile: (formData) =>
    api.post("/api/users/complete_profile/", formData, MULTIPART),
  // POST /api/change-password/  (authed; OQ#2 resolved)
  //   body: { current_password, new_password, confirm_password }
  //   200 → { status:'success', message, reauth_required, detail }
  //   400 → { errors: { current_password|new_password|confirm_password: string|string[] } }
  //   (old refresh token is blacklisted on success → app signs out + re-login.)
  changePassword: (payload) => api.post("/api/change-password/", payload),
};

// ───────────────────────── Wallet (§2.7) ─────────────────────────
export const walletService = {
  getWallet: () => api.get("/api/wallet/"),
  getSummary: () => api.get("/api/wallet/summary/"), // authoritative for balances (OQ#6)
  getTransactions: () => api.get("/api/wallet/transactions/"),
  getWithdrawals: () => api.get("/api/wallet/withdrawals/"),
  // { amount, withdraw_profit_only, bank_name, account_number, account_holder_name, swift_code, iban }
  withdraw: (payload) => api.post("/api/wallet/withdraw/", payload),
};

// ───────────────────────── Portfolio (§2.8) ─────────────────────────
export const portfolioService = {
  // GET /api/portfolio/my-portfolio/?months=
  getMyPortfolio: (months = 24) =>
    api.get("/api/portfolio/my-portfolio/", { params: { months } }),
  refresh: () => api.post("/api/portfolio/refresh/"),
};

// ──────────────────── Investments (mine) (§2.9) ────────────────────
export const myInvestmentsService = {
  // GET /api/investments/my_investments/  →  array of investment groups
  getMyInvestments: () => api.get("/api/investments/my_investments/"),
};

// ─────────────────── Internal market (§2.10) ───────────────────
export const internalMarketService = {
  getListings: () => api.get("/api/internal-market/listings/"),
  getHoldings: () => api.get("/api/internal-market/holdings/"),
  getUserListings: () => api.get("/api/internal-market/user-listings/"),
  getTransactions: () => api.get("/api/internal-market/transactions/"),
  getStatistics: () => api.get("/api/internal-market/statistics/"),

  // { investment_id, shares_to_sell, asking_price_per_share, listing_type }
  createListing: (payload) => api.post("/api/internal-market/create-listing/", payload),
  // { listing_id, shares, payment_method }
  purchase: (payload) => api.post("/api/internal-market/purchase/", payload),
  // { transaction_id, orderId, captureId, paymentStatus }
  paypalComplete: (payload) => api.post("/api/internal-market/paypal-complete/", payload),
  // multipart: { transaction_id, reference_number, transfer_proof }
  bankTransferUpload: (formData) =>
    api.post("/api/internal-market/bank-transfer-upload/", formData, MULTIPART),
};

// ─────────────────── Documents & misc (§2.11) ───────────────────
export const documentService = {
  getDocuments: () => api.get("/api/documents/"),
};

export const feedbackService = {
  // { email, subject, message, email_to, user_email }
  send: (payload) => api.post("/api/feedback/", payload),
};

export default {
  authService,
  opportunityService,
  feeService,
  investmentPaymentService,
  contractService,
  userService,
  walletService,
  portfolioService,
  myInvestmentsService,
  internalMarketService,
  documentService,
  feedbackService,
};
