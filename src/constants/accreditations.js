// Strategic partners / accreditations shown on the Verification page and the Home "Strategic
// Partners" section. Real brand logos live in src/constants/brandLogos.js (keyed by `logo`, rendered
// via <PartnerLogo>). Owner confirmed TWO partners, each with an official external verification link:
//   • CIM Global Financial (financial)   • CoverTech Insurance (insurance)
// `code` stays null (optional — the link IS the verification). Assurax was dropped per the owner.
// CoverTech reuses the `hcc` logo file for now — swap `logo` if a dedicated CoverTech asset arrives.
export const ACCREDITATIONS = [
  { key: "cim", name: "CIM Global Financial", icon: "shield-checkmark-outline", logo: "cim", link: "https://www.cimglobalfinancial.com/verification?tab=document", code: null },
  { key: "hcc", name: "CoverTech Insurance", icon: "umbrella-outline", logo: "hcc", link: "https://www.covertechinsurance.com/capimax-ecosystem", code: null },
];
