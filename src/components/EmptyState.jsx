// EmptyState (DESIGN.md §7) — centered outline icon + title + one line + optional action.
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppButton from "./AppButton";
import { useTheme } from "../context/ThemeContext";

export default function EmptyState({ icon = "albums-outline", title, message, actionLabel, onAction, style }) {
  const { theme, type } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={40} color={theme.textMuted} />
      </View>
      {title ? <Text style={[type.h2, styles.title]}>{title}</Text> : null}
      {message ? <Text style={[type.body, styles.message]}>{message}</Text> : null}
      {actionLabel ? (
        <AppButton title={actionLabel} variant="secondary" fullWidth={false} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    wrap: { alignItems: "center", justifyContent: "center", paddingVertical: 56, paddingHorizontal: 24, gap: 10 },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surfaceAlt,
      marginBottom: 4,
    },
    title: { color: theme.text, textAlign: "center" },
    message: { color: theme.textSecondary, textAlign: "center" },
    action: { marginTop: 8 },
  });
