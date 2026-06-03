// Shared auth-screen layout: brand badge + title/subtitle + a themed card holding the form.
// Uses the design type scale + mode-correct elevation (DESIGN.md §3/§4).
import React, { useMemo } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import Screen from "./Screen";
import { useTheme } from "./../context/ThemeContext";

export default function AuthCard({ title, subtitle, children, footer }) {
  const { theme, radii, type, elevation } = useTheme();
  const styles = useMemo(() => makeStyles(theme, radii), [theme, radii]);

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.badge}>
            <Text style={[type.label, styles.badgeText]}>CapiMax</Text>
          </View>
          {title ? <Text style={[type.h1, styles.title]}>{title}</Text> : null}
          {subtitle ? <Text style={[type.body, styles.subtitle]}>{subtitle}</Text> : null}

          <View style={[styles.card, elevation("card")]}>{children}</View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (theme, radii) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: "center", padding: 20, gap: 8 },
    badge: {
      alignSelf: "center",
      backgroundColor: theme.primary,
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: radii.pill,
      marginBottom: 10,
    },
    badgeText: { color: theme.onPrimary, fontWeight: "800", letterSpacing: 1 },
    title: { color: theme.text, textAlign: "center" },
    subtitle: { color: theme.textSecondary, textAlign: "center", marginBottom: 8 },
    card: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radii.card,
      padding: 20,
      gap: 14,
    },
    footer: { marginTop: 18, alignItems: "center", gap: 8 },
  });
