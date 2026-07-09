// Sister platforms in the Capimax ecosystem — single source for the Home "Our Platforms" section
// and the /platforms screen. Real names/URLs (verbatim from the web components/platforms/OurPlatforms;
// BRX + PropShare added per the client, with owner-provided domains). Descriptions live in locales
// under `platforms.descriptions.<key>`. Logos are web-only assets → an accent-tinted Ionicon stands
// in for each (kept uniform across all five).
export const PLATFORMS = [
  { key: "capimaxrt", name: "Capimax RT", url: "https://capimaxrt.tech", accent: "#818cf8", icon: "business-outline" },
  { key: "novadf", name: "Nova DeFi", url: "https://novadf.com", accent: "#22d3ee", icon: "git-network-outline" },
  { key: "pronovacrypto", name: "Pronova Crypto", url: "https://pronovacrypto.tech", accent: "#f59e0b", icon: "logo-bitcoin" },
  { key: "capimaxbrx", name: "Capimax BRX", url: "https://capimaxbrx.com", accent: "#2dd4bf", icon: "trending-up-outline" },
  { key: "capimaxpropshare", name: "Capimax PropShare", url: "https://capimaxpropshare.com", accent: "#fb7185", icon: "home-outline" },
];

// The Pronova ecosystem entry point (Home "Access Pronova" CTA).
export const PRONOVA_URL = "https://pronovacrypto.tech";
