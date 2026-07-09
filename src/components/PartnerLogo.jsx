// Renders a partner/institution brand logo (official square PNG from ACCREDITATIONS[].logo) via
// <Image>, contained so the aspect ratio is preserved. Callers place it on a light chip
// (Home "Strategic Partners" + the Verification page).
import React from "react";
import { Image } from "react-native";

export default function PartnerLogo({ source, height = 36 }) {
  if (!source) return null;
  return <Image source={source} style={{ height, width: height, resizeMode: "contain" }} />;
}
