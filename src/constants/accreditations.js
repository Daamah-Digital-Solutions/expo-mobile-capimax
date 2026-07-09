// Strategic partners / accreditations shown on the Verification page and the Home "Strategic
// Partners" section. Owner confirmed TWO partners, each with an OFFICIAL brand logo (PNG in
// assets/partner-logos, rendered via <PartnerLogo> as a contained square) + an official external
// verification link:  • CIM Global Financial (financial)   • CoverTech Insurance (insurance)
// `code` stays null (optional — the link IS the verification). Assurax was dropped per the owner.
export const ACCREDITATIONS = [
  { key: "cim", name: "CIM Global Financial", icon: "shield-checkmark-outline", logo: require("../../assets/partner-logos/cim.png"), link: "https://www.cimglobalfinancial.com/verification?tab=document", code: null },
  { key: "hcc", name: "CoverTech Insurance", icon: "umbrella-outline", logo: require("../../assets/partner-logos/covertech.png"), link: "https://www.covertechinsurance.com/capimax-ecosystem", code: null },
];
