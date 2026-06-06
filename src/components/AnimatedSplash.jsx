// AnimatedSplash — premium, code-animated splash rendered over the native splash on launch.
//
// On a full-screen navy (#121c30) background:
//   • a soft radial brand-green glow fades in behind the logo and gently pulses (very low opacity),
//   • the brand logo (crisp VECTOR via SplashLogo, contained — never cropped) fades in and settles
//     from 0.88 → 1.0 with a smooth spring,
//   • a calm HOLD so the logo + tagline can actually be read,
//   • then a graceful whole-splash fade-out.
// Total on-screen ~2.8–3.1s. OS reduce-motion → simple fade, shorter, no scale/pulse.
//
// The root layout calls SplashScreen.preventAutoHideAsync() at module load; once this overlay
// mounts we hide the native splash (no flash gap) and hand off to the gate when done. Fail open:
// an error boundary finishes immediately if the SVG can't render, so startup is never blocked.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import Svg, { Defs, RadialGradient, Stop, Circle } from "react-native-svg";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import SplashLogo from "./SplashLogo";

const BG = "#121c30"; // theme navy-dark — matches app.json splash backgroundColor
const LOGO_AR = 271.33 / 242.74; // source viewBox width/height (preserve aspect, no stretching)

// Fail-open boundary: if SplashLogo throws while rendering, finish immediately.
class SplashErrorBoundary extends React.Component {
  componentDidCatch() {
    this.props.onError && this.props.onError();
  }
  render() {
    return this.props.children;
  }
}

// Soft radial glow (crisp vector). Low-opacity brand green fading to transparent.
function Glow({ size }) {
  return (
    <Svg width={size} height={size} pointerEvents="none">
      <Defs>
        <RadialGradient id="splashGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#2fac6f" stopOpacity="0.22" />
          <Stop offset="55%" stopColor="#2fac6f" stopOpacity="0.08" />
          <Stop offset="100%" stopColor="#2fac6f" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#splashGlow)" />
    </Svg>
  );
}

export default function AnimatedSplash({ onFinish }) {
  const { width: sw, height: sh } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const done = useRef(false);

  // Logo box: ~64% of screen width, kept fully on-screen (cap height to ~half the screen so it's
  // never cropped on short/wide ratios), aspect-locked to the source viewBox.
  let logoW = Math.round(sw * 0.64);
  let logoH = Math.round(logoW / LOGO_AR);
  const maxH = sh * 0.5;
  if (logoH > maxH) {
    logoH = Math.round(maxH);
    logoW = Math.round(logoH * LOGO_AR);
  }
  const glowSize = Math.round(logoW * 1.9);

  const containerOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(reduceMotion ? 1 : 0.88);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.92);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    cancelAnimation(glowScale);
    setHidden(true);
    onFinish && onFinish();
  }, [onFinish, glowScale]);

  useEffect(() => {
    // Reveal our overlay by hiding the native splash.
    SplashScreen.hideAsync().catch(() => {});

    const IN = reduceMotion ? 420 : 800;
    const HOLD = reduceMotion ? 900 : 1500;
    const OUT = reduceMotion ? 380 : 550;

    if (reduceMotion) {
      // Simple fade only.
      logoOpacity.value = withTiming(1, { duration: IN, easing: Easing.out(Easing.cubic) });
      glowOpacity.value = withTiming(1, { duration: IN });
    } else {
      // Glow fades in, then breathes gently.
      glowOpacity.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) });
      glowScale.value = withDelay(
        300,
        withRepeat(withTiming(1.08, { duration: 1700, easing: Easing.inOut(Easing.sin) }), -1, true)
      );
      // Logo fades in + settles with a smooth spring.
      logoOpacity.value = withTiming(1, { duration: IN, easing: Easing.out(Easing.cubic) });
      logoScale.value = withSpring(1, { damping: 13, stiffness: 90, mass: 1 });
    }

    // After the calm hold, fade the whole splash out, then hand off to the gate.
    const t1 = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: OUT, easing: Easing.in(Easing.quad) }, (completed) => {
        if (completed) runOnJS(finish)();
      });
    }, IN + HOLD);

    // Hard safety cap — always finish even if a timer/animation stalls.
    const t2 = setTimeout(finish, IN + HOLD + OUT + 900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [finish, reduceMotion]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value, transform: [{ scale: glowScale.value }] }));
  const logoStyle = useAnimatedStyle(() => ({ opacity: logoOpacity.value, transform: [{ scale: logoScale.value }] }));

  if (hidden) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, containerStyle]} pointerEvents="none">
      {/* Soft glow behind the logo (absolute, centered). */}
      <Animated.View style={[styles.glow, { width: glowSize, height: glowSize }, glowStyle]} pointerEvents="none">
        <Glow size={glowSize} />
      </Animated.View>

      <SplashErrorBoundary onError={finish}>
        <Animated.View style={[{ width: logoW, height: logoH }, logoStyle]}>
          <SplashLogo width={logoW} height={logoH} />
        </Animated.View>
      </SplashErrorBoundary>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: BG, alignItems: "center", justifyContent: "center", zIndex: 999, elevation: 999 },
  glow: { position: "absolute", alignItems: "center", justifyContent: "center" },
});
