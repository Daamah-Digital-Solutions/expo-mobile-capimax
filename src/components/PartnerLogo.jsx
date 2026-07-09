// Renders a partner/institution brand logo from the generated PARTNER_LOGOS map via core <SvgXml>
// (classes were resolved to explicit fills at generation time — see src/constants/brandLogos.js).
// The source marks are full-colour and designed for light backgrounds, so callers place them on a
// light chip. Width is derived from the source viewBox so the aspect ratio is preserved.
import React from "react";
import { SvgXml } from "react-native-svg";
import { PARTNER_LOGOS } from "../constants/brandLogos";

export default function PartnerLogo({ name, height = 30 }) {
  const logo = PARTNER_LOGOS[name];
  if (!logo) return null;
  const width = Math.round(height * (logo.w / logo.h));
  return <SvgXml xml={logo.xml} width={width} height={height} />;
}
