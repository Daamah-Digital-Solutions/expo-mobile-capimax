// LockScreen — the biometric quick-unlock gate shown on launch when a valid session exists
// and the user has enabled biometric sign-in. Local convenience only (no backend call):
// passing the OS biometric prompt simply lifts the lock over the already-stored session.
// Always offers an "email & password instead" fallback so the user is never locked out.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { methodLabelKey } from "../utils/biometrics";

export default function LockScreen() {
  const { t } = useTranslation();
  const { theme, radii, type, spacing, statusBarStyle } = useTheme();
  const { isRTL } = useLanguage();
  const { unlock, signOut, biometric } = useAuth();
  const styles = useMemo(() => makeStyles(theme, radii, spacing, isRTL), [theme, radii, spacing, isRTL]);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(""); // "" | "failed" | "lockedout"
  const attempted = useRef(false);

  const method = t(methodLabelKey(biometric?.kind), "biometrics");
  const icon = biometric?.kind === "face" ? "scan-outline" : "finger-print-outline";

  const attempt = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setStatus("");
    const res = await unlock({
      promptMessage: t("biometric.promptUnlock", "Unlock CapiMax"),
      cancelLabel: t("biometric.cancel", "Cancel"),
    });
    setBusy(false);
    if (res?.success) return; // AuthContext clears the lock → app reveals
    // lockout / lockout_permanent → biometrics is temporarily blocked by the OS
    if (res?.error === "lockout" || res?.error === "lockout_permanent") {
      setStatus("lockedout");
    } else if (res?.error && res.error !== "user_cancel" && res.error !== "system_cancel" && res.error !== "app_cancel") {
      setStatus("failed");
    } else {
      setStatus(""); // user just cancelled — let them retry
    }
  }, [busy, unlock, t]);

  // Auto-trigger the prompt once on mount.
  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    attempt();
  }, [attempt]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style={statusBarStyle} />
      <View style={styles.body}>
        <View style={styles.center}>
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={44} color={theme.primary} />
          </View>
          <Text style={[type.h1, styles.title]}>{t("biometric.lockTitle", "Welcome back")}</Text>
          <Text style={[type.body, styles.subtitle]}>{t("biometric.lockSubtitle", "Unlock to continue")}</Text>

          {status === "failed" ? (
            <Text style={[type.caption, styles.error]}>{t("biometric.failed", "Couldn't verify it's you. Try again.")}</Text>
          ) : null}
          {status === "lockedout" ? (
            <Text style={[type.caption, styles.error]}>{t("biometric.lockedOut", "Too many attempts. Use your email & password instead.")}</Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          {status !== "lockedout" ? (
            <Pressable style={[styles.primaryBtn, busy && styles.btnDisabled]} onPress={attempt} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={theme.onPrimary} />
              ) : (
                <View style={styles.btnRow}>
                  <Ionicons name={icon} size={20} color={theme.onPrimary} />
                  <Text style={[type.label, styles.primaryText]}>
                    {t("biometric.unlockWith", "Unlock with {{method}}", { method })}
                  </Text>
                </View>
              )}
            </Pressable>
          ) : null}

          <Pressable style={styles.ghostBtn} onPress={signOut} disabled={busy}>
            <Text style={[type.label, styles.ghostText]}>{t("biometric.usePassword", "Use email & password instead")}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (theme, radii, spacing, isRTL) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    body: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, justifyContent: "space-between" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
    iconWrap: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(46,173,111,0.12)", // brand-tinted accent (works in both themes)
      marginBottom: 14,
    },
    title: { color: theme.text, textAlign: "center" },
    subtitle: { color: theme.textSecondary, textAlign: "center" },
    error: { color: theme.error, textAlign: "center", marginTop: 10, paddingHorizontal: 12 },
    actions: { gap: 10 },
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
    ghostText: { color: theme.primary, fontSize: 14, fontWeight: "700" },
  });
