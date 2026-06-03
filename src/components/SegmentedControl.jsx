// SegmentedControl (DESIGN.md §7/§8) — pill track; active segment slides (spring) to `surface`.
// RTL-aware (indicator position mirrors). Reduce-motion → instant move.
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, useReducedMotion } from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

// segments: [{ label, value }]
export default function SegmentedControl({ segments, value, onChange, style }) {
  const { theme, radii, type, elevation } = useTheme();
  const { isRTL } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, radii), [theme, radii]);
  const reduced = useReducedMotion();

  const [trackW, setTrackW] = useState(0);
  const count = segments.length;
  const segW = trackW ? (trackW - 8) / count : 0; // 4px inset each side
  const idx = Math.max(0, segments.findIndex((s) => s.value === value));
  const pos = isRTL ? count - 1 - idx : idx;

  const x = useSharedValue(0);
  useEffect(() => {
    const to = pos * segW;
    x.value = reduced ? to : withSpring(to, { damping: 18, stiffness: 180 });
  }, [pos, segW, reduced]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={[styles.track, style]} onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}>
      {segW > 0 ? (
        <Animated.View style={[styles.indicator, { width: segW }, elevation("card"), indicatorStyle]} />
      ) : null}
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <Pressable key={s.value} style={styles.segment} onPress={() => onChange(s.value)} hitSlop={6}>
            <Text style={[type.label, { color: active ? theme.text : theme.textSecondary }]} numberOfLines={1}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (theme, radii) =>
  StyleSheet.create({
    track: {
      flexDirection: "row",
      backgroundColor: theme.surfaceAlt,
      borderRadius: radii.pill,
      padding: 4,
      alignItems: "center",
    },
    indicator: {
      position: "absolute",
      top: 4,
      left: 4,
      bottom: 4,
      borderRadius: radii.pill,
      backgroundColor: theme.surface,
    },
    segment: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  });
