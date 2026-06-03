// Themed text input with label + inline error. Used by all forms.
// Handles RTL text alignment and a show/hide toggle for password fields.
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
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const [hidden, setHidden] = useState(secureTextEntry);
  const styles = useMemo(() => makeStyles(theme, isRTL), [theme, isRTL]);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, error && styles.inputRowError, !editable && styles.inputDisabled]}>
        <TextInput
          style={styles.input}
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
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} style={styles.eye}>
            <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={20} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const makeStyles = (theme, isRTL) =>
  StyleSheet.create({
    wrap: { gap: 6 },
    label: { color: theme.textSecondary, fontSize: 13, fontWeight: "600", textAlign: isRTL ? "right" : "left" },
    inputRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 12,
    },
    inputRowError: { borderColor: theme.error },
    inputDisabled: { opacity: 0.6 },
    input: {
      flex: 1,
      color: theme.text,
      fontSize: 15,
      paddingVertical: 12,
      textAlign: isRTL ? "right" : "left",
    },
    eye: { paddingHorizontal: 4 },
    error: { color: theme.error, fontSize: 12, textAlign: isRTL ? "right" : "left" },
  });
