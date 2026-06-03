// Themed button with loading + disabled states.
// variant: 'primary' (filled, onPrimary text — rule #4) | 'outline' | 'ghost'.
import React, { useMemo } from "react";
import { Pressable, Text, ActivityIndicator, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  icon,
  style,
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    variant === "primary" && styles.primary,
    variant === "outline" && styles.outline,
    variant === "ghost" && styles.ghost,
    isDisabled && styles.disabled,
    style,
  ];

  const textColor =
    variant === "primary" ? theme.onPrimary : theme.primary; // onPrimary on a primary fill (rule #4)

  return (
    <Pressable onPress={isDisabled ? undefined : onPress} style={containerStyle} disabled={isDisabled}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={textColor} /> : null}
          <Text style={[styles.text, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    base: { borderRadius: 10, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    primary: { backgroundColor: theme.primary },
    outline: { backgroundColor: "transparent", borderWidth: 1, borderColor: theme.primary },
    ghost: { backgroundColor: "transparent" },
    disabled: { opacity: 0.5 },
    text: { fontSize: 15, fontWeight: "700" },
  });
