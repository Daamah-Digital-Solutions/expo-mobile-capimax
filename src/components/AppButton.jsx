// AppButton (DESIGN.md §7) — variants: primary | secondary | ghost | icon.
// Press-scale via PressableScale; inline spinner when loading; dims when disabled.
import React, { useMemo } from "react";
import { Text, ActivityIndicator, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PressableScale from "./motion/PressableScale";
import { useTheme } from "../context/ThemeContext";

export default function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  icon,
  fullWidth = true,
  style,
}) {
  const { theme, radii, type } = useTheme();
  const styles = useMemo(() => makeStyles(theme, radii), [theme, radii]);
  const isDisabled = disabled || loading;

  const isIcon = variant === "icon";
  const containerStyle = [
    styles.base,
    isIcon && styles.icon,
    variant === "primary" && styles.primary,
    variant === "secondary" && styles.secondary,
    variant === "ghost" && styles.ghost,
    fullWidth && !isIcon && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  // Text/icon color: onPrimary on a green fill (rule #4); primary-colored otherwise.
  const fg = variant === "primary" ? theme.onPrimary : theme.primaryDark;

  return (
    <PressableScale onPress={isDisabled ? undefined : onPress} disabled={isDisabled} style={containerStyle}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
          {!isIcon && title ? <Text style={[type.label, styles.text, { color: fg }]}>{title}</Text> : null}
        </View>
      )}
    </PressableScale>
  );
}

const makeStyles = (theme, radii) =>
  StyleSheet.create({
    base: {
      height: 52,
      borderRadius: radii.button,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
    },
    fullWidth: { alignSelf: "stretch" },
    icon: { width: 52, paddingHorizontal: 0 },
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    text: { fontSize: 15, fontWeight: "700" },
    primary: { backgroundColor: theme.primary },
    secondary: { backgroundColor: "transparent", borderWidth: 1, borderColor: theme.primary },
    ghost: { backgroundColor: "transparent", height: "auto", paddingVertical: 8 },
    disabled: { opacity: 0.5 },
  });
