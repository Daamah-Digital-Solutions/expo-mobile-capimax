// Theme palettes — dark + light, with IDENTICAL token names so the two are interchangeable.
// Components must NEVER import these directly; read colors via useTheme() (src/context/ThemeContext).
//
// Brand: teal/green. RULE #4: text/icons placed on a `primary` (#2ead6f) fill are ALWAYS
// `onPrimary` (#0b2928, dark teal) in BOTH modes — never white. Use theme.onPrimary for that.

export const radius = {
  card: 14,
  sm: 8,
  pill: 999,
};

// On a primary fill, content is always dark teal in both modes (contrast rule).
const ON_PRIMARY = "#0b2928";

export const dark = {
  name: "dark",

  bg: "#0b2928",
  surface: "#103634",
  surfaceAlt: "#14403d",
  card: "#0f312f",

  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.18)",

  primary: "#2ead6f",
  primaryLight: "#54c98a",
  primaryDark: "#1f8a54",
  onPrimary: ON_PRIMARY,

  text: "#FFFFFF",
  textSecondary: "#9bbab2",
  textMuted: "#6f8d86",

  success: "#2ead6f",
  warning: "#FFA726",
  error: "#f44336",
  info: "#2196F3",

  gradientBrand: ["#2ead6f", "#54c98a"],
  gradientCard: ["#14403d", "#0b2928", "#14403d"],
};

export const light = {
  name: "light",

  bg: "#F2F7F4",
  surface: "#FFFFFF",
  surfaceAlt: "#E8F1EC",
  card: "#FFFFFF",

  border: "rgba(11,41,40,0.10)",
  borderStrong: "rgba(11,41,40,0.18)",

  primary: "#2ead6f",
  primaryLight: "#54c98a",
  primaryDark: "#1f8a54",
  onPrimary: ON_PRIMARY,

  text: "#0b2928",
  textSecondary: "#4f6f67",
  textMuted: "#7d9a92",

  success: "#1f9d5f",
  warning: "#E08600",
  error: "#d32f2f",
  info: "#1976D2",

  gradientBrand: ["#2ead6f", "#54c98a"],
  gradientCard: ["#FFFFFF", "#F2F7F4", "#FFFFFF"],
};

export const palettes = { dark, light };

export default palettes;
