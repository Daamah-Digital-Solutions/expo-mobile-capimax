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
import { useAuth } from "../../src/context/AuthContext";

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const { signIn } = useAuth();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError(t("form.please_fill_in_information", "Please fill in the information below"));
      return;
    }
    setLoading(true);
    const result = await signIn({ email: email.trim(), password });
    setLoading(false);

    if (result.status === "unverified") {
      // Route to verification (Flow A). Token storage / redirect handled there + by the gate.
      router.push({ pathname: "/(auth)/verify", params: { email: result.email || email.trim() } });
      return;
    }
    if (result.status === "error") {
      setError(result.message || t("verifyEmail.verificationFailed", "Login failed"));
      return;
    }
    // success → the auth gate redirects out of the (auth) group (to pendingRoute or funds).
  };

  return (
    <AuthCard
      title={t("form.welcome_back", "Welcome Back")}
      subtitle={t("form.please_sign_in", "Please sign in to your account")}
      footer={
        <Pressable onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.footerText}>
            {t("form.dont_have_account", "Don't have an account?")}{" "}
            <Text style={styles.link}>{t("form.sign_up", "Sign Up")}</Text>
          </Text>
        </Pressable>
      }
    >
      <Banner type="error" message={error} />

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
        autoComplete="password"
        onSubmitEditing={onSubmit}
        returnKeyType="go"
      />

      <Pressable onPress={() => router.push("/(auth)/forgot-password")} style={styles.forgot}>
        <Text style={styles.link}>{t("form.forgot_password", "Forgot Password?")}</Text>
      </Pressable>

      <Button title={t("form.sign_in", "Sign In")} onPress={onSubmit} loading={loading} />

      <View style={styles.orRow}>
        <View style={styles.line} />
        <Text style={styles.or}>{t("form.or_continue_with", "Or continue with")}</Text>
        <View style={styles.line} />
      </View>

      <GoogleSignInButton
        label={t("form.google_signin", "Sign in with Google")}
        onError={(m) => setError(m || t("form.google_auth_failed", "Google authentication failed"))}
      />
    </AuthCard>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    forgot: { alignSelf: "flex-end" },
    link: { color: theme.primary, fontWeight: "700" },
    footerText: { color: theme.textSecondary, fontSize: 14 },
    orRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 2 },
    line: { flex: 1, height: 1, backgroundColor: theme.border },
    or: { color: theme.textMuted, fontSize: 12 },
  });
