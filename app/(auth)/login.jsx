import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import AuthCard from "../../src/components/AuthCard";
import Field from "../../src/components/Field";
import AppButton from "../../src/components/AppButton";
import Banner from "../../src/components/Banner";
import GoogleSignInButton from "../../src/components/GoogleSignInButton";
import { useTheme } from "../../src/context/ThemeContext";
import { useAuth } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { getAccessToken } from "../../src/api/tokenStorage";
import { methodLabelKey } from "../../src/utils/biometrics";

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const { signIn, isLocked, biometricEnabled, biometric, unlock } = useAuth();
  const styles = useMemo(() => makeStyles(theme, isRTL), [theme, isRTL]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Biometric quick sign-in. Visible when a session exists AND biometrics is enabled+available:
  //   • on launch the gate routes here in "locked" mode (a stored session is being gated), or
  //   • the user enabled biometrics and still has a stored session.
  const [hasSession, setHasSession] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);
  const [bioError, setBioError] = useState("");
  const autoTried = useRef(false);

  const canBiometric = !!biometric?.available && biometricEnabled && (isLocked || hasSession);
  const bioMethod = t(methodLabelKey(biometric?.kind), "biometrics");
  const bioIcon = biometric?.kind === "face" ? "scan-outline" : "finger-print-outline";

  // Detect a stored session (covers the non-locked "enabled + session" case).
  useEffect(() => {
    let alive = true;
    getAccessToken()
      .then((tok) => alive && setHasSession(!!tok))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const runBiometric = async () => {
    if (bioBusy) return;
    setBioBusy(true);
    setBioError("");
    const res = await unlock({
      promptMessage: t("biometric.promptUnlock", "Unlock CapiMax"),
      cancelLabel: t("biometric.cancel", "Cancel"),
    });
    setBioBusy(false);
    if (res?.success) {
      // Locked path: clearing the lock lets the gate redirect to home. Non-locked safety net:
      if (!isLocked) router.replace("/(tabs)/home");
      return;
    }
    if (res?.error === "lockout" || res?.error === "lockout_permanent") {
      setBioError(t("biometric.lockedOut", "Too many attempts. Use your email & password instead."));
    } else if (res?.error && !["user_cancel", "system_cancel", "app_cancel"].includes(res.error)) {
      setBioError(t("biometric.failed", "Couldn't verify it's you. Try again."));
    }
  };

  // Auto-trigger the prompt once when biometric sign-in is available on open.
  useEffect(() => {
    if (canBiometric && !autoTried.current) {
      autoTried.current = true;
      runBiometric();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canBiometric]);

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
      router.push({ pathname: "/(auth)/verify", params: { email: result.email || email.trim() } });
      return;
    }
    if (result.status === "error") {
      setError(result.message || t("verifyEmail.verificationFailed", "Login failed"));
      return;
    }
    // success → applyTokens clears any lock; the auth gate redirects out of (auth), and the
    // one-time "enable biometrics?" offer (branded overlay) appears if applicable.
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

      {/* Biometric quick sign-in — prominent, on-brand; email/password remains below as fallback. */}
      {canBiometric ? (
        <View style={styles.bioBlock}>
          <Pressable
            style={({ pressed }) => [styles.bioCircle, pressed && { transform: [{ scale: 0.96 }] }]}
            onPress={runBiometric}
            disabled={bioBusy}
            accessibilityRole="button"
            accessibilityLabel={t("biometric.unlockWith", "Unlock with {{method}}", { method: bioMethod })}
          >
            {bioBusy ? <ActivityIndicator color={theme.primary} /> : <Ionicons name={bioIcon} size={42} color={theme.primary} />}
          </Pressable>
          <Text style={styles.bioLabel}>{t("biometric.unlockWith", "Unlock with {{method}}", { method: bioMethod })}</Text>
          {bioError ? <Text style={styles.bioError}>{bioError}</Text> : null}

          <View style={styles.orRow}>
            <View style={styles.line} />
            <Text style={styles.or}>{t("biometric.orEmail", "or sign in with email")}</Text>
            <View style={styles.line} />
          </View>
        </View>
      ) : null}

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

      <AppButton title={t("form.sign_in", "Sign In")} onPress={onSubmit} loading={loading} />

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

const makeStyles = (theme, isRTL) =>
  StyleSheet.create({
    forgot: { alignSelf: "flex-end" },
    link: { color: theme.primary, fontWeight: "700" },
    footerText: { color: theme.textSecondary, fontSize: 14 },
    orRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 2 },
    line: { flex: 1, height: 1, backgroundColor: theme.border },
    or: { color: theme.textMuted, fontSize: 12 },
    // Biometric block
    bioBlock: { alignItems: "center", gap: 8, marginBottom: 4 },
    bioCircle: {
      width: 84,
      height: 84,
      borderRadius: 42,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(46,173,111,0.12)",
      borderWidth: 1,
      borderColor: theme.primary,
    },
    bioLabel: { color: theme.text, fontSize: 15, fontWeight: "700", textAlign: "center" },
    bioError: { color: theme.error, fontSize: 12, textAlign: "center", paddingHorizontal: 8 },
  });
