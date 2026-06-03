// Banner (DESIGN.md §7) — info/success/warning/error tinted row + icon + text + optional retry.
import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

const ICONS = { error: "alert-circle", success: "checkmark-circle", info: "information-circle", warning: "warning" };

export default function Banner({ type = "info", message, actionLabel, onAction }) {
  const { theme, radii, type: typo } = useTheme();
  const { isRTL } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);
  if (!message) return null;

  const color = theme[type] || theme.info;
  return (
    <View style={[styles.wrap, { borderColor: color + "55", backgroundColor: color + "1A" }]}>
      <Ionicons name={ICONS[type]} size={18} color={color} />
      <Text style={[typo.caption, styles.text, { color: theme.text }]}>{message}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[typo.label, { color }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    wrap: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radii.sm,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    text: { flex: 1, textAlign: isRTL ? "right" : "left" },
  });
