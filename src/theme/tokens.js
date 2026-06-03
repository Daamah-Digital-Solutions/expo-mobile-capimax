// Design tokens (mode-independent): spacing, radii, typography, motion, elevation.
// Derived from DESIGN.md §2–§4, §8. Exposed via useTheme() (spacing/radii/type/elevation).
import { StyleSheet } from "react-native";

// §2 — base unit 4.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20, // screen horizontal padding
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  cardGap: 14,
  section: 28,
};

// §3 — radii.
export const radii = {
  card: 20,
  image: 18,
  button: 14,
  input: 14,
  pill: 999,
  sheet: 28,
  badge: 8,
  sm: 12,
};

// Back-compat alias (older components import radius.{card,sm,pill}).
export const radius = radii;

// §4 — type scale. Spread into a Text style.
export const type = {
  display: { fontSize: 34, fontWeight: "700", lineHeight: 40 },
  h1: { fontSize: 26, fontWeight: "600", lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: "600", lineHeight: 26 },
  statNumber: { fontSize: 22, fontWeight: "600", lineHeight: 28 },
  body: { fontSize: 15, fontWeight: "400", lineHeight: 22 },
  label: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: "400", lineHeight: 16 },
  micro: { fontSize: 11, fontWeight: "600", lineHeight: 14 },
};

// §8 — motion durations/easing knobs (used by the reanimated helpers).
export const motion = {
  press: 120,
  entrance: 280,
  stagger: 40,
  countUp: 600,
  shimmer: 1100,
};

// §3 — elevation. Light = soft shadow; dark = surface + hairline border (no shadow).
export function makeElevation(scheme, theme, level = "card") {
  if (scheme === "light") {
    if (level === "raised") {
      return {
        shadowColor: "#0b2928",
        shadowOpacity: 0.1,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 6,
      };
    }
    if (level === "none") return {};
    return {
      shadowColor: "#0b2928",
      shadowOpacity: 0.06,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    };
  }
  // dark — no shadow (won't read); use a hairline border on the raised surface.
  if (level === "none") return {};
  return { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border };
}
