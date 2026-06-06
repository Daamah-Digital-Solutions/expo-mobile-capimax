// AnimatedSplash — calm, code-animated splash rendered over the native splash on launch.
//
// Renders the brand logo as a crisp VECTOR (react-native-svg via SplashLogo) on a full-screen
// navy (#121c30) background — sharp at any size, contained so it's never cropped on any aspect
// ratio. Animation (react-native-reanimated): the logo fades in + gently scales 0.92→1.0, holds
// briefly, then the whole splash fades out (total on-screen ~2–2.5s). OS reduce-motion → fade only.
//
// The root layout calls SplashScreen.preventAutoHideAsync() at module load; once this overlay
// mounts we hide the native splash (no flash gap) and hand off to the gate when done. Fail open:
// if the SVG can't render, an error boundary finishes immediately so startup is never blocked.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
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

export default function AnimatedSplash({ onFinish }) {
  const { width: sw, height: sh } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const done = useRef(false);

  // Logo box: ~66% of screen width, kept fully on-screen (cap height to ~half the screen so it's
  // never cropped on short/wide aspect ratios), aspect-locked to the source viewBox.
  let logoW = Math.round(sw * 0.66);
  let logoH = Math.round(logoW / LOGO_AR);
  const maxH = sh * 0.5;
  if (logoH > maxH) {
    logoH = Math.round(maxH);
    logoW = Math.round(logoH * LOGO_AR);
  }

  const containerOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(reduceMotion ? 1 : 0.92);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setHidden(true);
    onFinish && onFinish();
  }, [onFinish]);

  useEffect(() => {
    // Reveal our overlay by hiding the native splash.
    SplashScreen.hideAsync().catch(() => {});

    const IN = reduceMotion ? 450 : 700;
    const HOLD = 1000;
    const OUT = 350;

    // Fade (+ scale) in.
    logoOpacity.value = withTiming(1, { duration: IN, easing: Easing.out(Easing.cubic) });
    if (!reduceMotion) {
      logoScale.value = withTiming(1, { duration: IN, easing: Easing.out(Easing.cubic) });
    }

    // After the hold, fade the whole splash out, then hand off to the gate.
    const t1 = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: OUT }, (completed) => {
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
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  if (hidden) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, containerStyle]} pointerEvents="none">
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
});
