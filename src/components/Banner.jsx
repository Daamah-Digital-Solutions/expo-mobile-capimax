// Inline status banner for error / success / info messages on forms.
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

const ICONS = { error: "alert-circle", success: "checkmark-circle", info: "information-circle" };

export default function Banner({ type = "info", message }) {
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, isRTL), [theme, isRTL]);
  if (!message) return null;

  const color = theme[type] || theme.info;
  return (
    <View style={[styles.wrap, { borderColor: color, backgroundColor: color + "1A" }]}>
      <Ionicons name={ICONS[type]} size={18} color={color} />
      <Text style={[styles.text, { color: theme.text }]}>{message}</Text>
    </View>
  );
}

const makeStyles = (theme, isRTL) =>
  StyleSheet.create({
    wrap: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderRadius: 10,
      padding: 12,
    },
    text: { flex: 1, fontSize: 13, textAlign: isRTL ? "right" : "left" },
  });
