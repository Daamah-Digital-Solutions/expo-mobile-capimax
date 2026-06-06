// LottieSplash — splash that plays assets/splash-logo.json (a PURE VECTOR Lottie: 360x720, 60fps,
// 3.0s, 18 shape layers, no embedded raster) on a full-screen navy (#121c30) background. Vector →
// crisp at any size, no pixelation. The animation is sized to an explicitly-computed contained box
// (largest 360x720-aspect box that fits the screen), centered, so the whole frame shows with NO
// cropping on any aspect ratio. Plays to completion (~3.0s) then fades out, with a hard ~3.5s cap.
//
// Holds the native splash via expo-splash-screen (handled in the root layout); fails open via an
// error boundary if Lottie can't render, so startup is never blocked.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import LottieView from "lottie-react-native";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const BG = "#121c30"; // theme navy-dark — matches app.json splash backgroundColor (letterbox bars)
const COMP_AR = 360 / 720; // source comp width/height = 0.5
const MAX_MS = 3500; // hard cap; the animation itself is ~3.0s

// Fail-open boundary: if Lottie throws while rendering, finish immediately.
class SplashErrorBoundary extends React.Component {
  componentDidCatch() {
    this.props.onError && this.props.onError();
  }
  render() {
    return this.props.children;
  }
}

export default function LottieSplash({ onFinish }) {
  const { width: sw, height: sh } = useWindowDimensions();
  const [hidden, setHidden] = useState(false);
  const done = useRef(false);
  const opacity = useSharedValue(1);

  // Largest 360x720-aspect box that fits fully inside the screen (true contain → no crop).
  let boxW = sw;
  let boxH = Math.round(sw / COMP_AR);
  if (boxH > sh) {
    boxH = sh;
    boxW = Math.round(sh * COMP_AR);
  }

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setHidden(true);
    onFinish && onFinish();
  }, [onFinish]);

  // Graceful fade-out, then hand off to the gate.
  const fadeThenFinish = useCallback(() => {
    if (done.current) return;
    opacity.value = withTiming(0, { duration: 320 }, (completed) => {
      if (completed) runOnJS(finish)();
    });
  }, [finish, opacity]);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    const cap = setTimeout(fadeThenFinish, MAX_MS);
    return () => clearTimeout(cap);
  }, [fadeThenFinish]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (hidden) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, style]} pointerEvents="none">
      <SplashErrorBoundary onError={finish}>
        <View style={{ width: boxW, height: boxH }}>
          <LottieView
            source={require("../../assets/splash-logo.json")}
            autoPlay
            loop={false}
            resizeMode="contain"
            onAnimationFinish={fadeThenFinish}
            onAnimationFailure={finish}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </SplashErrorBoundary>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: BG, alignItems: "center", justifyContent: "center", zIndex: 999, elevation: 999 },
});
