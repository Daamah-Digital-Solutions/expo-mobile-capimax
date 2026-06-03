import React, { useMemo, useState } from "react";
import { Text, Pressable, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthCard from "../../src/components/AuthCard";
import Field from "../../src/components/Field";
import AppButton from "../../src/components/AppButton";
import Banner from "../../src/components/Banner";
import { useTheme } from "../../src/context/ThemeContext";
import { authService } from "../../src/api/services";
import { validatePassword } from "../../src/utils/passwordValidation";

// Reached via the password-reset email link (deep link carries `token`). Universal-link wiring
// is a Phase 10 task; the screen reads `token` from params and is otherwise fully functional.
export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const token = typeof params.token === "string" ? params.token : "";
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async () => {
    setError("");
    setSuccess("");
    setPwError("");
    setConfirmError("");

    if (!token) {
      setError(t("resetPassword.invalidToken", "Invalid or missing reset token"));
      return;
    }
    const pwErrors = validatePassword(password);
    if (pwErrors.length) {
      setPwError(t(pwErrors[0]));
      setError(t("resetPassword.fixPasswordErrors", "Please fix the password errors below."));
      return;
    }
    if (password !== confirm) {
      setConfirmError(t("resetPassword.passwordMismatch", "Passwords do not match"));
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ token, new_password: password });
      setSuccess(t("resetPassword.successMessage", "Password has been reset successfully! Redirecting to login..."));
      setTimeout(() => router.replace("/(auth)/login"), 1500);
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors?.password) {
        setPwError(Array.isArray(data.errors.password) ? data.errors.password[0] : String(data.errors.password));
      }
      setError(data?.message || t("resetPassword.errorMessage", "Failed to reset password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title={t("resetPassword.title", "Set New Password")}
      subtitle={t("resetPassword.subtitle", "Please enter your new password below")}
      footer={
        <Pressable onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.link}>{t("form.sign_in", "Sign In")}</Text>
        </Pressable>
      }
    >
      <Banner type="error" message={error} />
      <Banner type="success" message={success} />
      {!token ? <Banner type="error" message={t("resetPassword.invalidToken", "Invalid or missing reset token")} /> : null}

      <Field
        label={t("resetPassword.newPassword", "New Password")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={pwError}
      />
      <Field
        label={t("resetPassword.confirmPassword", "Confirm Password")}
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        error={confirmError}
        onSubmitEditing={onSubmit}
        returnKeyType="go"
      />

      <Button
        title={t("resetPassword.resetPassword", "Reset Password")}
        onPress={onSubmit}
        loading={loading}
        disabled={!token}
      />
    </AuthCard>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    link: { color: theme.primary, fontWeight: "700", textAlign: "center" },
  });
