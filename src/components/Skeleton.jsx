// Shimmer skeleton (DESIGN.md §7/§8) — a moving highlight sweep over a surfaceAlt block.
// Use skeletons for loading (not spinners). Reduce-motion → static block.
import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, useReducedMotion } from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function Skeleton({ width = "100%", height = 16, radius = 8, style }) {
  const { theme, scheme } = useTheme();
  const reduced = useReducedMotion();
  const progress = useSharedValue(-1);
  const [boxW, setBoxW] = useState(0);

  useEffect(() => {
    if (!reduced) {
      progress.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, false);
    }
  }, [reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * (boxW || 220) }],
  }));

  const highlight = scheme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.65)";

  return (
    <View
      onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}
      style={[{ width, height, borderRadius: radius, backgroundColor: theme.surfaceAlt, overflow: "hidden" }, style]}
    >
      {!reduced ? (
        <AnimatedLinearGradient
          colors={["transparent", highlight, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, animatedStyle]}
        />
      ) : null}
    </View>
  );
}
