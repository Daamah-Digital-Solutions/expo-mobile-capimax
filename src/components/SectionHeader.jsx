// SectionHeader (DESIGN.md §7) — h2 title + optional trailing "See all" ghost action.
import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

export default function SectionHeader({ title, actionLabel, onAction, style }) {
  const { theme, type } = useTheme();
  const { isRTL } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, isRTL), [theme, isRTL]);

  return (
    <View style={[styles.row, style]}>
      <Text style={[type.h2, { color: theme.text }]}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} style={styles.action} hitSlop={8}>
          <Text style={[type.label, { color: theme.primaryDark }]}>{actionLabel}</Text>
          <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={14} color={theme.primaryDark} />
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (theme, isRTL) =>
  StyleSheet.create({
    row: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    action: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 2 },
  });
