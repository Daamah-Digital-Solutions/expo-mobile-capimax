// ReturnPill / DeltaPill (DESIGN.md §7) — positive/negative tinted pill, always shows sign.
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

// value: number (percent or amount). `suffix` e.g. "%". onImage = legible chip over a photo.
export default function ReturnPill({ value, suffix = "%", onImage = false, showIcon = true, style }) {
  const { theme, radii, type } = useTheme();
  const styles = useMemo(() => makeStyles(theme, radii), [theme, radii]);

  const n = Number(value) || 0;
  const positive = n >= 0;
  const toneColor = positive ? theme.positive : theme.negative;
  const bg = onImage ? "rgba(0,0,0,0.45)" : toneColor + "22";
  const fg = onImage ? (positive ? theme.primaryLight : "#ff9b9b") : toneColor;
  const sign = positive ? "+" : "";

  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      {showIcon ? <Ionicons name={positive ? "trending-up" : "trending-down"} size={12} color={fg} /> : null}
      <Text style={[type.micro, { color: fg }]}>
        {sign}
        {n.toFixed(2)}
        {suffix}
      </Text>
    </View>
  );
}

const makeStyles = (theme, radii) =>
  StyleSheet.create({
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: radii.pill,
    },
  });
