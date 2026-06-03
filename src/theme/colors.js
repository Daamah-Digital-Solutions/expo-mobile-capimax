// CapiMax dark theme tokens — from CLAUDE.md §9.
// Single source of truth for colors. Do not hardcode hex values in components.

export const colors = {
  bg: "#0B0C18",
  surface: "#0F101E",
  surfaceAlt: "#1a1b31",
  card: "#141528",
  border: "rgba(255,255,255,0.10)",

  primary: "#4f46e5",
  primaryLight: "#818cf8",

  text: "#FFFFFF",
  textSecondary: "#92939E",

  success: "#4CAF50",
  warning: "#FFA726",
  error: "#f44336",
  info: "#2196F3",
};

// Brand gradient: [#4f46e5 → #818cf8]
export const gradients = {
  brand: ["#4f46e5", "#818cf8"],
  // Card background: linear(135deg, #1a1b31, #0F101E, #1a1b31)
  card: ["#1a1b31", "#0F101E", "#1a1b31"],
};

export const radius = {
  card: 14,
  sm: 8,
  pill: 999,
};

export default colors;
