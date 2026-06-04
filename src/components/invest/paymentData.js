// Bank accounts + crypto wallet addresses — copied VERBATIM from the web
// (BankTransferForm.jsx + CryptoTransferForm.jsx). Real destinations — do not edit
// without confirming against the dashboard, since these receive live funds.

export const BANK_ACCOUNTS = [
  {
    id: "adcb1",
    label: "ADCB Account 1",
    currency: "AED",
    fields: [
      { key: "accountHolderName", label: "Account Holder Name", value: "CAPI MAX INVESTMENTS - LLC" },
      { key: "iban", label: "IBAN", value: "AE020030014107784910001" },
      { key: "accountNumber", label: "Account Number", value: "14107784910001" },
      { key: "swift", label: "SWIFT/BIC", value: "ADCBAEAAXXX" },
      { key: "bankName", label: "Bank Name", value: "ABU DHABI COMMERCIAL BANK" },
      { key: "branchAddress", label: "Branch", value: "161 / Al Nahyan Camp Branch" },
      { key: "currency", label: "Currency", value: "AED" },
    ],
  },
  {
    id: "adcb2",
    label: "ADCB Account 2",
    currency: "AED",
    fields: [
      { key: "accountHolderName", label: "Account Holder Name", value: "CAPI MAX INVESTMENTS - LLC" },
      { key: "iban", label: "IBAN", value: "AE500030014107784920001" },
      { key: "accountNumber", label: "Account Number", value: "14107784920001" },
      { key: "swift", label: "SWIFT/BIC", value: "ADCBAEAAXXX" },
      { key: "bankName", label: "Bank Name", value: "ABU DHABI COMMERCIAL BANK" },
      { key: "branchAddress", label: "Branch", value: "161 / Al Nahyan Camp Branch" },
      { key: "currency", label: "Currency", value: "AED" },
    ],
  },
  {
    id: "wise_gbp",
    label: "Wise Business Account",
    currency: "GBP",
    fields: [
      { key: "accountHolderName", label: "Account Holder Name", value: "Capimaxinvestments Limited" },
      { key: "sortCode", label: "Sort Code", value: "23-08-01" },
      { key: "accountNumber", label: "Account Number", value: "28891485" },
      { key: "iban", label: "IBAN", value: "GB72 TRWI 2308 0128 8914 85" },
      { key: "swift", label: "SWIFT/BIC", value: "TRWIGB2LXXX" },
      { key: "bankName", label: "Bank Name", value: "Wise" },
      { key: "branchAddress", label: "Branch Address", value: "56 Shoreditch High Street, London, E1 6JJ, United Kingdom" },
      { key: "currency", label: "Currency", value: "GBP" },
    ],
  },
  {
    id: "wise_usd",
    label: "Wise Business Account",
    currency: "USD",
    fields: [
      { key: "accountHolderName", label: "Account Holder Name", value: "capimax investments LLC" },
      { key: "accountType", label: "Account Type", value: "Checking" },
      { key: "accountNumber", label: "Account Number", value: "465164156255842" },
      { key: "routingNumber", label: "Routing Number", value: "084009519" },
      { key: "swift", label: "SWIFT/BIC", value: "TRWIUS35XXX" },
      { key: "bankName", label: "Bank Name", value: "Column National Association" },
      { key: "branchAddress", label: "Branch Address", value: "30 W. 26th Street, Sixth Floor, New York, NY 10010, United States" },
      { key: "currency", label: "Currency", value: "USD" },
    ],
  },
];

// Crypto: web maps BNB/ETH → same 0x… address, SOL → Solana address.
export const CRYPTO_CURRENCIES = [
  { value: "BNB", label: "BNB Smart Chain (BNB)", network: "BSC", address: "0x36b7a9C1F6c5a2749623672E15b21Ce258B749Ee" },
  { value: "ETH", label: "Ethereum (ETH)", network: "Ethereum", address: "0x36b7a9C1F6c5a2749623672E15b21Ce258B749Ee" },
  { value: "SOL", label: "Solana (SOL)", network: "Solana", address: "7nJhWVGUPUkBwSk8wSsEBs5FVzsjH5AHa98m85cYFwN9" },
];
