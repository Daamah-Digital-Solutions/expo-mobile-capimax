// Platform-level accreditations shown on the Verification page. The real external verify LINKS and
// codes (e.g. CIN + official verification URL, HCC, Assurax) are provided by the owner (Phase B).
// Until then `link`/`code` stay null and the UI shows a "verification link coming soon" note per
// item — we never invent a code or URL.
export const ACCREDITATIONS = [
  { key: "cim", name: "CIM Financial Group", icon: "shield-checkmark-outline", link: null, code: null },
  { key: "hcc", name: "HCC Insurance", icon: "umbrella-outline", link: null, code: null },
  { key: "assurax", name: "Assurax", icon: "document-text-outline", link: null, code: null },
];
