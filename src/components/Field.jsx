// Field (DESIGN.md §7) — label + input (height 52, radius 14), 1.5px primary focus ring,
// negative error text, show/hide for passwords. RTL-aware.
import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

export default function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  keyboardType,
  autoCapitalize = "none",
  autoComplete,
  editable = true,
  maxLength,
  onSubmitEditing,
  returnKeyType,
}) {
  const { theme, radii, type } = useTheme();
  const { isRTL } = useLanguage();
  const [hidden, setHidden] = useState(secureTextEntry);
  const [focused, setFocused] = useState(false);
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const borderColor = error ? theme.negative : focused ? theme.primary : theme.border;
  const borderWidth = error || focused ? 1.5 : StyleSheet.hairlineWidth;

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[type.label, styles.label]}>{label}</Text> : null}
      <View style={[styles.inputRow, { borderColor, borderWidth }, !editable && styles.disabled]}>
        <TextInput
          style={[type.body, styles.input]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          editable={editable}
          maxLength={maxLength}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} style={styles.eye}>
            <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={20} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[type.caption, styles.error]}>{error}</Text> : null}
    </View>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    wrap: { gap: 6 },
    label: { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" },
    inputRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      backgroundColor: theme.surfaceAlt,
      borderRadius: radii.input,
      paddingHorizontal: 14,
      height: 52,
    },
    disabled: { opacity: 0.6 },
    input: { flex: 1, color: theme.text, textAlign: isRTL ? "right" : "left", height: "100%" },
    eye: { paddingHorizontal: 4 },
    error: { color: theme.negative, textAlign: isRTL ? "right" : "left" },
  });
