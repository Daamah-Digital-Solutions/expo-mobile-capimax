// Renders a platform logo, contained within a box (aspect preserved, centered by the parent):
//   • svg → white+green wordmark from PLATFORM_LOGOS via <SvgXml> (scaled to fit the box)
//   • png → brand raster via <Image resizeMode="contain">
// Both variants are light-on-dark, sized to sit on the dark platform card.
import React from "react";
import { Image } from "react-native";
import { SvgXml } from "react-native-svg";
import { PLATFORM_LOGOS } from "../constants/platformLogos";

export default function PlatformLogo({ logo, boxW = 168, boxH = 46 }) {
  if (!logo) return null;
  if (logo.kind === "svg") {
    const l = PLATFORM_LOGOS[logo.id];
    if (!l) return null;
    const scale = Math.min(boxW / l.w, boxH / l.h);
    return <SvgXml xml={l.xml} width={Math.round(l.w * scale)} height={Math.round(l.h * scale)} />;
  }
  return <Image source={logo.src} style={{ width: boxW, height: boxH, resizeMode: "contain" }} />;
}
