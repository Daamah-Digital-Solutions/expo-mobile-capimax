// Badge (DESIGN.md §7) — small trust/verification badge: tinted bg + icon + micro text.
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

// tone: 'primary' | 'positive' | 'info' | 'neutral'
export default function Badge({ label, icon, tone = "primary", onImage = false, style }) {
  const { theme, radii, type } = useTheme();
  const styles = useMemo(() => makeStyles(theme, radii), [theme, radii]);

  const toneColor =
    tone === "positive" ? theme.positive : tone === "info" ? theme.info : tone === "neutral" ? theme.textSecondary : theme.primary;

  // On an image, use a frosted translucent chip (not a solid block) with a hairline light edge.
  const bg = onImage ? "rgba(0,0,0,0.38)" : toneColor + "22";
  const fg = onImage ? "#FFFFFF" : tone === "primary" ? theme.primaryDark : toneColor;
  const onImageBorder = onImage ? { borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.22)" } : null;

  return (
    <View style={[styles.badge, { backgroundColor: bg }, onImageBorder, style]}>
      {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
      <Text style={[type.micro, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const makeStyles = (theme, radii) =>
  StyleSheet.create({
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radii.badge,
    },
  });
