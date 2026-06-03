// Chip (DESIGN.md §7) — filter/tag pill. selected = primary tint bg + primaryDark text.
import React, { useMemo } from "react";
import { Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PressableScale from "./motion/PressableScale";
import { useTheme } from "../context/ThemeContext";

export default function Chip({ label, selected = false, onPress, icon, style }) {
  const { theme, radii, type } = useTheme();
  const styles = useMemo(() => makeStyles(theme, radii), [theme, radii]);
  const fg = selected ? theme.primaryDark : theme.textSecondary;

  return (
    <PressableScale onPress={onPress} style={[styles.chip, selected && styles.selected, style]}>
      {icon ? <Ionicons name={icon} size={14} color={fg} /> : null}
      <Text style={[type.caption, styles.text, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const makeStyles = (theme, radii) =>
  StyleSheet.create({
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radii.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
    },
    selected: { backgroundColor: theme.primary + "22", borderColor: theme.primary },
    text: { fontWeight: "600" },
  });
