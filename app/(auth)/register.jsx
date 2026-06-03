import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthCard from "../../src/components/AuthCard";
import Field from "../../src/components/Field";
import Button from "../../src/components/Button";
import Banner from "../../src/components/Banner";
import GoogleSignInButton from "../../src/components/GoogleSignInButton";
import { useTheme } from "../../src/context/ThemeContext";
import { authService } from "../../src/api/services";
import { validatePassword } from "../../src/utils/passwordValidation";

// Flatten a DRF-style errors object ({ field: [msg] | msg }) into a single message.
function flattenErrors(errors) {
  if (!errors) return "";
  if (typeof errors === "string") return errors;
  return Object.values(errors)
    .map((v) => (Array.isArray(v) ? v.join(" ") : String(v)))
    .join("\n");
}

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async () => {
    setError("");
    setSuccess("");
    setPwError("");

    if (!username.trim() || !email.trim() || !password) {
      setError(t("form.please_fill_in_information", "Please fill in the information below"));
      return;
    }
    const pwErrors = validatePassword(password);
    if (pwErrors.length) {
      setPwError(t(pwErrors[0]));
      return;
    }

    setLoading(true);
    try {
      const res = await authService.register({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      if (res?.data?.success === false) {
        setError(flattenErrors(res.data.errors) || res.data.message || t("common.error", "Error"));
        return;
      }
      setSuccess(t("form.registration_success", "Registration successful"));
      setTimeout(() => {
        router.replace({ pathname: "/(auth)/verify", params: { email: email.trim() } });
      }, 1200);
    } catch (err) {
      const data = err?.response?.data;
      setError(flattenErrors(data?.errors) || data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title={t("form.create_account", "Create Account")}
      subtitle={t("form.please_fill_in_information", "Please fill in the information below")}
      footer={
        <Pressable onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.footerText}>
            {t("form.already_have_account", "Already have an account?")}{" "}
            <Text style={styles.link}>{t("form.sign_in", "Sign In")}</Text>
          </Text>
        </Pressable>
      }
    >
      <Banner type="error" message={error} />
      <Banner type="success" message={success} />

      <Field label={t("form.username", "Username")} value={username} onChangeText={setUsername} autoCapitalize="none" />
      <Field
        label={t("form.email", "Email")}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
      />
      <Field
        label={t("form.password", "Password")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={pwError}
      />
      <Text style={styles.hint}>{t("resetPassword.passwordLengthError", "Password must be at least 8 characters long.")}</Text>

      <Button title={t("form.sign_up", "Sign Up")} onPress={onSubmit} loading={loading} />

      <View style={styles.orRow}>
        <View style={styles.line} />
        <Text style={styles.or}>{t("form.or_continue_with", "Or continue with")}</Text>
        <View style={styles.line} />
      </View>
      <GoogleSignInButton
        label={t("form.google_signup", "Sign up with Google")}
        onError={(m) => setError(m || t("form.google_auth_failed", "Google authentication failed"))}
      />
    </AuthCard>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    link: { color: theme.primary, fontWeight: "700" },
    footerText: { color: theme.textSecondary, fontSize: 14 },
    hint: { color: theme.textMuted, fontSize: 12, marginTop: -6 },
    orRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 2 },
    line: { flex: 1, height: 1, backgroundColor: theme.border },
    or: { color: theme.textMuted, fontSize: 12 },
  });
