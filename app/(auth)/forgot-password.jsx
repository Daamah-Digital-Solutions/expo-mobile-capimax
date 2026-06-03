import React, { useMemo, useState } from "react";
import { Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthCard from "../../src/components/AuthCard";
import Field from "../../src/components/Field";
import AppButton from "../../src/components/AppButton";
import Banner from "../../src/components/Banner";
import { useTheme } from "../../src/context/ThemeContext";
import { authService } from "../../src/api/services";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async () => {
    setError("");
    setSuccess("");
    if (!email.trim()) {
      setError(t("forgotPassword.email", "Email"));
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSuccess(t("forgotPassword.successMessage", "Password reset instructions have been sent to your email."));
    } catch (err) {
      setError(err?.response?.data?.message || t("forgotPassword.errorMessage", "Failed to process request"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title={t("forgotPassword.title", "Reset Password")}
      subtitle={t("forgotPassword.subtitle", "Enter your email address to receive reset instructions")}
      footer={
        <Pressable onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.footerText}>
            {t("forgotPassword.rememberPassword", "Remember your password?")}{" "}
            <Text style={styles.link}>{t("forgotPassword.signIn", "Sign In")}</Text>
          </Text>
        </Pressable>
      }
    >
      <Banner type="error" message={error} />
      <Banner type="success" message={success} />

      <Field
        label={t("forgotPassword.email", "Email")}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
        onSubmitEditing={onSubmit}
        returnKeyType="go"
      />

      <AppButton title={t("forgotPassword.sendInstructions", "Send Reset Instructions")} onPress={onSubmit} loading={loading} />
    </AuthCard>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    link: { color: theme.primary, fontWeight: "700" },
    footerText: { color: theme.textSecondary, fontSize: 14 },
  });
