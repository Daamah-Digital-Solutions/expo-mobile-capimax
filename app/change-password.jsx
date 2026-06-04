// Change Password (Phase 8) — UI ONLY, intentionally BLOCKED.
// ⚠️ The web pages/change-password is a UI shell with NO backend endpoint (API_AND_FLOWS §6
// OQ#2). We do NOT invent one. The full form is built (current / new / confirm with the same
// client rules ≥8 / upper / digit / special), but submit is disabled and a "coming soon" notice
// is shown. When the owner provides the real endpoint+payload, wire the TODO in `submit()` and
// flip `ENDPOINT_READY` to true — no other change needed.
import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../src/components/Screen";
import Card from "../src/components/Card";
import Banner from "../src/components/Banner";
import Field from "../src/components/Field";
import AppButton from "../src/components/AppButton";
import FadeInView from "../src/components/motion/FadeInView";
import { useTheme } from "../src/context/ThemeContext";
import { useLanguage } from "../src/context/LanguageContext";
import { validatePassword } from "../src/utils/passwordValidation";

// Flip to true once the backend change-password endpoint is provided (OQ#2).
const ENDPOINT_READY = false;

const RULES = [
  { key: "resetPassword.passwordLengthError", test: (p) => p.length >= 8 },
  { key: "resetPassword.passwordUppercaseError", test: (p) => /[A-Z]/.test(p) },
  { key: "resetPassword.passwordNumberError", test: (p) => /[0-9]/.test(p) },
  { key: "resetPassword.passwordSpecialCharError", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const ruleErrors = validatePassword(next);
  const mismatch = confirm.length > 0 && next !== confirm;
  const formValid = current.trim() && next && confirm && ruleErrors.length === 0 && !mismatch;

  const submit = () => {
    // Client validation is ready; the network call is intentionally not wired.
    setError("");
    if (ruleErrors.length > 0) return setError(t("resetPassword.fixPasswordErrors", "Please fix the password errors below."));
    if (mismatch) return setError(t("resetPassword.passwordMismatch", "Passwords do not match"));
    if (!ENDPOINT_READY) {
      // TODO(owner): wire the real endpoint here once provided (OQ#2), e.g.
      //   await userService.changePassword({ current_password: current, new_password: next });
      // then show success + router.back(). Until then this stays a no-op behind the notice.
      return;
    }
  };

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <Pressable style={styles.headerBack} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color={theme.text} />
      </Pressable>
      <Text style={[type.label, { color: theme.text }]}>{t("changePassword.title", "Change Password")}</Text>
      <View style={styles.headerBack} />
    </View>
  );

  return (
    <Screen edges={["bottom"]}>
      {Header}
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40, gap: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{t("changePassword.subtitle", "Update your account password")}</Text>

        {/* Blocked notice (no endpoint yet) */}
        <FadeInView index={0}>
          <Banner type="info" message={t("changePassword.comingSoon", "Password change is coming soon. This will be enabled once the secure endpoint is available.")} />
        </FadeInView>

        {error ? <Banner type="error" message={error} /> : null}

        <FadeInView index={1}>
          <Card style={{ gap: 12 }}>
            <Field label={t("changePassword.currentPassword", "Current Password")} value={current} onChangeText={setCurrent} secureTextEntry />
            <Field label={t("changePassword.newPassword", "New Password")} value={next} onChangeText={setNext} secureTextEntry />
            <Field
              label={t("changePassword.confirmNewPassword", "Confirm New Password")}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              error={mismatch ? t("resetPassword.passwordMismatch", "Passwords do not match") : undefined}
            />

            {/* Live password-rule checklist */}
            {next.length > 0 ? (
              <View style={{ gap: 6 }}>
                {RULES.map((r) => {
                  const ok = r.test(next);
                  return (
                    <View key={r.key} style={styles.ruleRow}>
                      <Ionicons name={ok ? "checkmark-circle" : "ellipse-outline"} size={15} color={ok ? theme.positive : theme.textMuted} />
                      <Text style={[type.caption, { color: ok ? theme.text : theme.textMuted, flex: 1, textAlign: isRTL ? "right" : "left" }]}>{t(r.key)}</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </Card>
        </FadeInView>

        <AppButton
          title={t("changePassword.changePassword", "Change Password")}
          icon="lock-closed"
          disabled={!ENDPOINT_READY || !formValid}
          onPress={submit}
        />
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    header: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 8 },
    headerBack: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
    ruleRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 },
  });
