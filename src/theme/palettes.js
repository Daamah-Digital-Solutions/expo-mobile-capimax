// Theme palettes — dark (navy + green) + light (Stake-style), with IDENTICAL token names.
// Source of truth for colors (DESIGN.md §1). Components read these via useTheme() — never import.
//
// RULE #4: content on a `primary` (#2ead6f) fill is ALWAYS `onPrimary` (#0b2928) in BOTH modes.

const ON_PRIMARY = "#0b2928";

// LIGHT — Stake-style, primary experience (near-white, faint green tint).
export const light = {
  name: "light",

  bg: "#F4F7F5",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF3F0",
  card: "#FFFFFF",

  border: "rgba(11,41,40,0.08)",
  borderStrong: "rgba(11,41,40,0.14)",

  primary: "#2ead6f",
  primaryLight: "#54c98a",
  primaryDark: "#1f8a54", // primary-colored TEXT/links on light bg (contrast)
  onPrimary: ON_PRIMARY,

  text: "#0b2928",
  textSecondary: "#5a7a72",
  textMuted: "#93aaa3",

  positive: "#1f9d5f",
  negative: "#d64545",

  success: "#1f9d5f", // = positive (Banner/semantic)
  warning: "#E08600",
  error: "#d32f2f",
  info: "#1976D2",

  gradientBrand: ["#2ead6f", "#1f8a54"],
  gradientCard: ["#FFFFFF", "#F4F7F5", "#FFFFFF"],
};

// DARK — navy base + green accent (brand identity). Green is the only saturated color.
export const dark = {
  name: "dark",

  bg: "#121c30",
  surface: "#1a2942",
  surfaceAlt: "#223457",
  card: "#18243c",

  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.18)",

  primary: "#2ead6f",
  primaryLight: "#54c98a",
  primaryDark: "#1f8a54",
  onPrimary: ON_PRIMARY,

  text: "#FFFFFF",
  textSecondary: "#9fb0c9",
  textMuted: "#6b7a93",

  positive: "#3ddb86",
  negative: "#ff6b6b",

  success: "#3ddb86", // = positive
  warning: "#FFA726",
  error: "#f44336",
  info: "#2196F3",

  gradientBrand: ["#2ead6f", "#1f8a54"],
  gradientCard: ["#223457", "#121c30", "#223457"],
};

export const palettes = { dark, light };

export default palettes;
