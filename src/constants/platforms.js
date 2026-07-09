// Sister platforms in the Capimax ecosystem — single source for the Home "Our Platforms" section
// and the /platforms screen. Real names/URLs (from the web OurPlatforms; BRX + PropShare added per
// the client with owner-provided domains). Descriptions live in locales under
// `platforms.descriptions.<key>`. Each platform shows its real LOGO on the dark card:
//   • svg → white+green wordmark from src/constants/platformLogos.js (rendered via <SvgXml>)
//   • png → brand raster in assets/platform-logos (rendered via <Image>)
export const PLATFORMS = [
  { key: "capimaxrt", name: "Capimax RT", url: "https://capimaxrt.tech", accent: "#818cf8", logo: { kind: "svg", id: "capimaxrt" } },
  { key: "novadf", name: "Nova Digital Finance", url: "https://novadf.com", accent: "#22d3ee", logo: { kind: "png", src: require("../../assets/platform-logos/novadf.png") } },
  { key: "pronovacrypto", name: "Pronova Crypto", url: "https://pronovacrypto.tech", accent: "#f59e0b", logo: { kind: "png", src: require("../../assets/platform-logos/pronovacrypto.png") } },
  { key: "capimaxbrx", name: "Capimax BRX", url: "https://capimaxbrx.com", accent: "#2dd4bf", logo: { kind: "svg", id: "capimaxbrx" } },
  { key: "capimaxpropshare", name: "Capimax PropShare", url: "https://capimaxpropshare.com", accent: "#fb7185", logo: { kind: "svg", id: "capimaxpropshare" } },
];

// The Pronova ecosystem entry point (Home "Access Pronova" CTA).
export const PRONOVA_URL = "https://pronovacrypto.tech";
