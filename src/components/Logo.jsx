// Logo — themed brand wordmark. Renders the navy logo in LIGHT mode and the white logo in DARK
// mode (crisp vector via react-native-svg, never stretched). Size with `height` OR `width`; the
// other dimension follows the active variant's own aspect ratio. Default height 26.
//
// NOTE: the two source assets have different aspect ratios (navy ≈ 12.2:1, white ≈ 3.8:1), so at a
// given height the light and dark logos render at different widths. Size placements deliberately.
import React from "react";
import { useTheme } from "../context/ThemeContext";
import LogoNavy, { ASPECT as NAVY_AR } from "./logo/LogoNavy";
import LogoWhite, { ASPECT as WHITE_AR } from "./logo/LogoWhite";

export default function Logo({ height, width, style }) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const Variant = dark ? LogoWhite : LogoNavy;
  const ar = dark ? WHITE_AR : NAVY_AR; // width / height

  let w = width;
  let h = height;
  if (w == null && h == null) h = 26;
  if (w == null) w = h * ar;
  if (h == null) h = w / ar;

  return <Variant width={Math.round(w)} height={Math.round(h)} style={style} />;
}
