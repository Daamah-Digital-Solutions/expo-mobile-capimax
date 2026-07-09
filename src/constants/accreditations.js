// Platform-level accreditations / strategic partners shown on the Verification page and the Home
// "Strategic Partners" section. Real brand logos live in src/constants/brandLogos.js (keyed by
// `logo`) and render via <PartnerLogo>. The external verify LINKS and codes (e.g. CIN + official
// verification URL) are still provided by the owner (Phase B); until then `link`/`code` stay null
// and the Verification UI shows a "coming soon" note per item — we never invent a code or URL.
export const ACCREDITATIONS = [
  { key: "cim", name: "CIM Financial Group", icon: "shield-checkmark-outline", logo: "cim", link: null, code: null },
  { key: "hcc", name: "HCC Insurance", icon: "umbrella-outline", logo: "hcc", link: null, code: null },
  { key: "assurax", name: "Assurax", icon: "document-text-outline", logo: "assurax", link: null, code: null },
];
