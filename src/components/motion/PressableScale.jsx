// Pressable with a calm press-scale (DESIGN.md §8). Respects OS reduce-motion.
import React from "react";
import { Pressable } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, useReducedMotion } from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PressableScale({ children, onPress, style, disabled, scaleTo = 0.97, ...rest }) {
  const scale = useSharedValue(1);
  const reduced = useReducedMotion();
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = () => {
    if (!reduced) scale.value = withTiming(scaleTo, { duration: 120 });
  };
  const onPressOut = () => {
    if (!reduced) scale.value = withTiming(1, { duration: 120 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
