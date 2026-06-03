// Shared auth-screen layout: brand badge + title/subtitle + a themed card holding the form.
// Handles keyboard avoidance and scrolling. Card styling works in both light and dark modes.
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Screen from "./Screen";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

export default function AuthCard({ title, subtitle, children, footer }) {
  const { theme, radius } = useTheme();
  const { isRTL } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, radius, isRTL), [theme, radius, isRTL]);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.badge}>
            <Text style={styles.badgeText}>CapiMax</Text>
          </View>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <View style={styles.card}>{children}</View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (theme, radius, isRTL) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: "center", padding: 20, gap: 8 },
    badge: {
      alignSelf: "center",
      backgroundColor: theme.primary,
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: radius.pill,
      marginBottom: 6,
    },
    badgeText: { color: theme.onPrimary, fontWeight: "800", letterSpacing: 1, fontSize: 15 },
    title: { color: theme.text, fontSize: 24, fontWeight: "800", textAlign: "center" },
    subtitle: { color: theme.textSecondary, fontSize: 14, textAlign: "center", marginBottom: 6 },
    card: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: radius.card,
      padding: 18,
      gap: 14,
    },
    footer: { marginTop: 16, alignItems: "center", gap: 8 },
  });
