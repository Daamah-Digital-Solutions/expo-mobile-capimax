// AnimatedSplash — full-screen splash played over the native splash on launch.
//
// NOTE on splash.json: it is a frame-by-frame RASTER animation (41 embedded 720x1280 WEBP
// bitmaps), not a vector Lottie. So we must (a) never crop it and (b) never upscale it past its
// native frame. We compute the largest box that fits 720x1280 *inside* the screen (true "contain"
// letterboxing), center it on the #121c30 background, and render the Lottie at exactly that size —
// guaranteeing the whole frame is visible with no cropping on any aspect ratio. Because the source
// is only 720px wide it will soften slightly when the device scales it up; a vector or >=1440px
// asset would render crisp.
//
// Flow: the root layout calls SplashScreen.preventAutoHideAsync() at module load. Once this overlay
// mounts we hide the native splash (our Lottie becomes what's on screen — no flash gap), play
// splash.json once, and fade out on finish OR a hard ~3.5s cap. If Lottie ever fails to load/render
// we finish immediately so startup is never blocked.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, useWindowDimensions, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import LottieView from "lottie-react-native";

const BG = "#121c30"; // theme navy-dark — matches app.json splash backgroundColor (letterbox bars)
const FRAME_W = 720; // native frame size of splash.json
const FRAME_H = 1280;
const MAX_MS = 3500; // hard cap; let the key part of the animation play, but never hang the app

export default function AnimatedSplash({ onFinish }) {
  const { width: sw, height: sh } = useWindowDimensions();
  const opacity = useRef(new Animated.Value(1)).current;
  const [hidden, setHidden] = useState(false);
  const done = useRef(false);

  // Largest box with the frame's exact aspect ratio that fits fully inside the screen (contain).
  const scale = Math.min(sw / FRAME_W, sh / FRAME_H);
  const boxW = Math.round(FRAME_W * scale);
  const boxH = Math.round(FRAME_H * scale);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setHidden(true);
      onFinish && onFinish();
    });
  }, [opacity, onFinish]);

  useEffect(() => {
    // Reveal our overlay by hiding the native splash, then arm the hard timeout cap.
    SplashScreen.hideAsync().catch(() => {});
    const timer = setTimeout(finish, MAX_MS);
    return () => clearTimeout(timer);
  }, [finish]);

  if (hidden) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, { opacity }]} pointerEvents="none">
      {/* Centered box at the frame's aspect ratio → whole frame visible, navy fills the bars. */}
      <View style={{ width: boxW, height: boxH }}>
        <LottieView
          source={require("../../splash.json")}
          autoPlay
          loop={false}
          resizeMode="contain"
          onAnimationFinish={finish}
          onAnimationFailure={finish} // Lottie couldn't render → don't block startup
          style={StyleSheet.absoluteFill}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: BG, alignItems: "center", justifyContent: "center", zIndex: 999, elevation: 999 },
});
