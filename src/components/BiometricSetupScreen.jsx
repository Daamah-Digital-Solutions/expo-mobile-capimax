// BiometricSetupScreen — branded, full-screen "enable biometric sign-in?" offer shown ONCE after
// the first successful login (replaces the old system Alert). Rendered as an overlay on top of the
// app by the root layout while auth.biometricSetupVisible is true. Design system, both modes + RTL.
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { methodLabelKey } from "../utils/biometrics";

export default function BiometricSetupScreen() {
  const { t } = useTranslation();
  const { theme, radii, type, spacing, statusBarStyle } = useTheme();
  const { isRTL } = useLanguage();
  const { biometric, enableBiometricFromSetup, dismissBiometricSetup } = useAuth();
  const styles = useMemo(() => makeStyles(theme, radii, spacing, isRTL), [theme, radii, spacing, isRTL]);

  const [busy, setBusy] = useState(false);
  const method = t(methodLabelKey(biometric?.kind), "biometrics");
  const icon = biometric?.kind === "face" ? "scan-outline" : "finger-print-outline";

  const onEnable = async () => {
    if (busy) return;
    setBusy(true);
    await enableBiometricFromSetup({
      promptMessage: t("biometric.promptVerify", "Confirm it's you"),
      cancelLabel: t("biometric.cancel", "Cancel"),
    });
    setBusy(false); // overlay is dismissed by context on completion
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style={statusBarStyle} />
      <View style={styles.body}>
        <View style={styles.center}>
          <View style={styles.iconOuter}>
            <View style={styles.iconInner}>
              <Ionicons name={icon} size={52} color={theme.primary} />
            </View>
          </View>
          <Text style={[type.h1, styles.title]}>{t("biometric.setupTitle", "Sign in faster")}</Text>
          <Text style={[type.body, styles.benefit]}>
            {t("biometric.setupBenefit", "Use {{method}} to unlock Capimax next time — your password is never stored.", { method })}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={[styles.primaryBtn, busy && styles.btnDisabled]} onPress={onEnable} disabled={busy}>
            {busy ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <View style={styles.btnRow}>
                <Ionicons name={icon} size={20} color={theme.onPrimary} />
                <Text style={[type.label, styles.primaryText]}>{t("biometric.enable", "Enable")}</Text>
              </View>
            )}
          </Pressable>
          <Pressable style={styles.ghostBtn} onPress={dismissBiometricSetup} disabled={busy}>
            <Text style={[type.label, styles.ghostText]}>{t("biometric.maybeLater", "Maybe later")}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (theme, radii, spacing, isRTL) =>
  StyleSheet.create({
    safe: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.bg, zIndex: 50 },
    body: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, justifyContent: "space-between" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    iconOuter: {
      width: 132,
      height: 132,
      borderRadius: 66,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(46,173,111,0.10)",
      marginBottom: 16,
    },
    iconInner: {
      width: 92,
      height: 92,
      borderRadius: 46,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(46,173,111,0.16)",
    },
    title: { color: theme.text, textAlign: "center" },
    benefit: { color: theme.textSecondary, textAlign: "center", paddingHorizontal: 16, lineHeight: 22 },
    actions: { gap: 8 },
    primaryBtn: {
      height: 52,
      borderRadius: radii.button,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
    },
    btnDisabled: { opacity: 0.6 },
    btnRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 },
    primaryText: { color: theme.onPrimary, fontSize: 15, fontWeight: "700" },
    ghostBtn: { height: 48, alignItems: "center", justifyContent: "center" },
    ghostText: { color: theme.textMuted, fontSize: 14, fontWeight: "700" },
  });
