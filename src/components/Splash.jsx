// Splash — single switch between the two splash implementations. Flip SPLASH_MODE to revert
// instantly; both code paths are kept intact.
//   'lottie' → LottieSplash (assets/splash-logo.json, pure vector)
//   'svg'    → AnimatedSplash (react-native-svg logo + reanimated glow/spring)
import React from "react";
import LottieSplash from "./LottieSplash";
import AnimatedSplash from "./AnimatedSplash";

export const SPLASH_MODE = "lottie"; // 'lottie' | 'svg'

export default function Splash(props) {
  return SPLASH_MODE === "lottie" ? <LottieSplash {...props} /> : <AnimatedSplash {...props} />;
}
