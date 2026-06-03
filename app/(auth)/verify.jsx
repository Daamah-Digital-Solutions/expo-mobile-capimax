import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthCard from "../../src/components/AuthCard";
import Field from "../../src/components/Field";
import AppButton from "../../src/components/AppButton";
import Banner from "../../src/components/Banner";
import { useTheme } from "../../src/context/ThemeContext";
import { useAuth } from "../../src/context/AuthContext";
import { authService } from "../../src/api/services";

export default function VerifyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const { applyTokens } = useAuth();
  const params = useLocalSearchParams();
  const email = typeof params.email === "string" ? params.email : "";
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Countdown for the resend button.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const onResend = async () => {
    if (cooldown > 0 || !email) return;
    setError("");
    setSuccess("");
    setResending(true);
    try {
      await authService.resendVerification(email);
      setSuccess(t("verifyEmail.newCodeSent", "New verification code sent!"));
      setCooldown(60);
    } catch (err) {
      setError(t("verifyEmail.resendFailed", "Failed to resend verification code. Please try again."));
    } finally {
      setResending(false);
    }
  };

  const onSubmit = async () => {
    setError("");
    setSuccess("");
    if (!email || !code.trim()) {
      setError(t("verifyEmail.missingParameters", "Both email and verification code are required."));
      return;
    }
    setLoading(true);
    try {
      const res = await authService.verifyEmail({ email, code: code.trim() });
      setSuccess(res?.data?.message || t("verifyEmail.verificationSuccess", "Verification successful!"));

      if (res?.data?.token) {
        // Logs the user straight in (the gate then leaves the auth group).
        await applyTokens({ access: res.data.token, refresh: res.data.refresh, email });
      } else {
        setTimeout(() => router.replace("/(auth)/login"), 1200);
      }
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 400) {
        setError(data?.detail || data?.error || t("verifyEmail.missingParameters", "Both email and verification code are required."));
      } else if (status === 404) {
        setError(t("verifyEmail.userNotFound", "User not found. Please register first."));
        setTimeout(() => router.replace("/(auth)/register"), 3000);
      } else if (status === 500) {
        setError(t("verifyEmail.serverError", "Server error. Please try again later."));
      } else {
        setError(data?.detail || data?.error || t("verifyEmail.verificationFailed", "Verification failed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title={t("verifyEmail.emailVerification", "Email Verification")}
      subtitle={
        email
          ? `${t("verifyEmail.codeSentTo", "Code sent to")} ${email}`
          : t("verifyEmail.noEmail", "No email provided. Please register first.")
      }
      footer={
        <Pressable onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.link}>{t("form.sign_in", "Sign In")}</Text>
        </Pressable>
      }
    >
      <Banner type="error" message={error} />
      <Banner type="success" message={success} />

      <Field
        label={t("verifyEmail.verificationCode", "Verification Code")}
        placeholder={t("verifyEmail.enterCode", "Enter 6-digit code")}
        value={code}
        onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ""))}
        keyboardType="number-pad"
        maxLength={6}
        onSubmitEditing={onSubmit}
        returnKeyType="go"
      />

      <AppButton title={t("verifyEmail.verifyEmail", "Verify Email")} onPress={onSubmit} loading={loading} disabled={!email} />

      <Pressable onPress={onResend} disabled={cooldown > 0 || resending || !email} style={styles.resend}>
        <Text style={[styles.link, (cooldown > 0 || !email) && styles.linkDisabled]}>
          {cooldown > 0
            ? `${t("verifyEmail.resendIn", "Resend code in")} ${cooldown}s`
            : t("verifyEmail.resendCode", "Resend verification code")}
        </Text>
      </Pressable>
    </AuthCard>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    link: { color: theme.primary, fontWeight: "700", textAlign: "center" },
    linkDisabled: { color: theme.textMuted },
    resend: { alignItems: "center", marginTop: 4 },
  });
