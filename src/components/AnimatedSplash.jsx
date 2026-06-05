// AnimatedSplash — full-screen Lottie splash played over the native splash on launch.
//
// Flow: the root layout calls SplashScreen.preventAutoHideAsync() at module load so the native
// splash stays up until JS is ready. Once this overlay mounts we hide the native splash (so our
// Lottie is what the user sees — no flash gap), play splash.json once on a #121c30 background,
// and fade out when it finishes OR after a hard ~2.5s cap. If Lottie ever fails to load/parse we
// finish immediately so startup is never blocked.
//
// splash.json is 720×1280 (9:16 portrait); resizeMode="contain" scales it safely on any device.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import LottieView from "lottie-react-native";

const BG = "#121c30"; // theme navy-dark — matches app.json splash backgroundColor
const MAX_MS = 2500; // hard cap; we never hold the app longer than this

export default function AnimatedSplash({ onFinish }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [hidden, setHidden] = useState(false);
  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
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
      <LottieView
        source={require("../../splash.json")}
        autoPlay
        loop={false}
        resizeMode="contain"
        onAnimationFinish={finish}
        onAnimationFailure={finish} // Lottie couldn't render → don't block startup
        style={styles.lottie}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: BG, alignItems: "center", justifyContent: "center", zIndex: 999, elevation: 999 },
  lottie: { width: "100%", height: "100%" },
});
