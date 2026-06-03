// Entrance: fade + rise (translateY 12→0), staggered by `index` (DESIGN.md §8).
// Runs once on mount. Reduce-motion → simple fade (no translate).
import React, { useEffect } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing, useReducedMotion } from "react-native-reanimated";

export default function FadeInView({ children, index = 0, style, duration = 280, distance = 12 }) {
  const progress = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const delay = reduced ? 0 : index * 40;
    progress.value = withDelay(delay, withTiming(1, { duration: reduced ? 160 : duration, easing: Easing.out(Easing.cubic) }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: reduced ? [] : [{ translateY: (1 - progress.value) * distance }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
