// Change Password (Phase 8 UI → wired in Phase 10, OQ#2 RESOLVED).
//   POST /api/change-password/ (authed) { current_password, new_password, confirm_password }
//   200 → { status:'success', message, reauth_required:false, detail }
//   400 → { errors: { current_password|new_password|confirm_password : string | string[] } }
//        (new_password may be an ARRAY of reasons → render all)
//   401 → { detail }  (genuine token issue)
// On success the backend blacklists the old refresh token → we sign out and route to login so
// the user re-authenticates with the new password (matches the backend's "log in again" guidance).
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { useAuth } from "../src/context/AuthContext";
import { validatePassword } from "../src/utils/passwordValidation";
import { userService } from "../src/api/services";

// Live as of OQ#2 resolution.
const ENDPOINT_READY = true;

const RULES = [
  { key: "resetPassword.passwordLengthError", test: (p) => p.length >= 8 },
  { key: "resetPassword.passwordUppercaseError", test: (p) => /[A-Z]/.test(p) },
  { key: "resetPassword.passwordNumberError", test: (p) => /[0-9]/.test(p) },
  { key: "resetPassword.passwordSpecialCharError", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const firstStr = (v) => (Array.isArray(v) ? v[0] : v) || undefined;
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({}); // { current_password, new_password(str|arr), confirm_password }
  const timer = useRef(null);

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  const ruleErrors = validatePassword(next);
  const mismatch = confirm.length > 0 && next !== confirm;
  const formValid = current.trim() && next && confirm && ruleErrors.length === 0 && !mismatch;

  const newPwReasons = asList(fieldErrors.new_password);

  const submit = async () => {
    setError("");
    setFieldErrors({});
    if (ruleErrors.length > 0) return setError(t("resetPassword.fixPasswordErrors", "Please fix the password errors below."));
    if (mismatch) return setError(t("resetPassword.passwordMismatch", "Passwords do not match"));

    setLoading(true);
    try {
      const res = await userService.changePassword({
        current_password: current,
        new_password: next,
        confirm_password: confirm,
      });
      if (res?.data?.status === "success") {
        setLoading(false);
        setSuccess(res.data?.message || t("changePassword.successRelogin", "Your password has been changed. Please sign in again with your new password."));
        // Old refresh token is blacklisted server-side → sign out + go to login.
        timer.current = setTimeout(async () => {
          await signOut();
          router.replace("/(auth)/login");
        }, 1600);
      } else {
        setLoading(false);
        setError(res?.data?.message || res?.data?.detail || t("changePassword.errorMessage", "Failed to change password. Please try again."));
      }
    } catch (err) {
      setLoading(false);
      const status = err?.response?.status;
      const data = err?.response?.data || {};
      if (status === 401) {
        setError(data.detail || t("changePassword.errorMessage", "Failed to change password. Please try again."));
        return;
      }
      const fe = data.errors || data; // field-level errors live under `errors`
      if (fe && (fe.current_password || fe.new_password || fe.confirm_password)) {
        setFieldErrors({
          current_password: firstStr(fe.current_password),
          new_password: fe.new_password, // keep raw (string OR array) → rendered in full below
          confirm_password: firstStr(fe.confirm_password),
        });
      } else {
        setError(data.message || data.detail || err?.message || t("changePassword.errorMessage", "Failed to change password. Please try again."));
      }
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

        {!ENDPOINT_READY ? (
          <Banner type="info" message={t("changePassword.comingSoon", "Password change is coming soon.")} />
        ) : null}

        {success ? <Banner type="success" message={success} /> : null}
        {error ? <Banner type="error" message={error} /> : null}

        <FadeInView index={0}>
          <Card style={{ gap: 12 }}>
            <Field
              label={t("changePassword.currentPassword", "Current Password")}
              value={current}
              onChangeText={setCurrent}
              secureTextEntry
              editable={!success}
              error={fieldErrors.current_password}
            />

            <View style={{ gap: 6 }}>
              <Field
                label={t("changePassword.newPassword", "New Password")}
                value={next}
                onChangeText={setNext}
                secureTextEntry
                editable={!success}
                error={newPwReasons.length === 1 ? newPwReasons[0] : undefined}
              />
              {/* Backend may return MULTIPLE new_password reasons (array) — render them all. */}
              {newPwReasons.length > 1 ? (
                <View style={{ gap: 3 }}>
                  {newPwReasons.map((r, i) => (
                    <View key={i} style={styles.ruleRow}>
                      <Ionicons name="alert-circle" size={14} color={theme.negative} />
                      <Text style={[type.caption, { color: theme.negative, flex: 1, textAlign: isRTL ? "right" : "left" }]}>{r}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <Field
              label={t("changePassword.confirmNewPassword", "Confirm New Password")}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              editable={!success}
              error={fieldErrors.confirm_password || (mismatch ? t("resetPassword.passwordMismatch", "Passwords do not match") : undefined)}
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
          loading={loading}
          disabled={!ENDPOINT_READY || !formValid || !!success}
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
