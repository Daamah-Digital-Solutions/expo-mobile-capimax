import React, { useEffect, useMemo, useState } from "react";
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
  const { signIn, signOut, isLocked, biometricEnabled, biometric, unlock } = useAuth();
  const styles = useMemo(() => makeStyles(theme, isRTL), [theme, isRTL]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Biometric quick sign-in. The button is shown when a stored session exists AND biometrics is
  // enabled+available (launch "lock" routed here, or enabled + a session). The OS prompt runs ONLY
  // when the user taps the button — never automatically. Email/password remains as the fallback.
  const [hasSession, setHasSession] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);
  const [bioError, setBioError] = useState("");

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
      if (!isLocked) router.replace("/(tabs)/home"); // non-locked safety net; locked path → gate
      return;
    }
    if (res?.error === "lockout" || res?.error === "lockout_permanent") {
      setBioError(t("biometric.lockedOut", "Too many attempts. Use your email & password instead."));
    } else if (res?.error && !["user_cancel", "system_cancel", "app_cancel"].includes(res.error)) {
      setBioError(t("biometric.failed", "Couldn't verify it's you. Try again."));
    }
  };

  // Full sign-out / switch account: wipe session + biometric prefs, then land on Login so the
  // back gesture can't return into the authenticated app.
  const onSwitchAccount = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

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
    // success → applyTokens clears any lock; the gate redirects out of (auth) and the one-time
    // "enable biometrics?" branded overlay appears if applicable.
  };

  return (
    <AuthCard
      title={t("login.heading", "Log in or sign up")}
      footer={
        <Pressable onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.footerText}>
            {t("login.newPrompt", "New to CapiMax?")}{" "}
            <Text style={styles.link}>{t("form.sign_up", "Sign Up")}</Text>
          </Text>
        </Pressable>
      }
    >
      <Banner type="error" message={error} />

      {/* Social — kept visible but inactive until OAuth client IDs are provided (renders disabled). */}
      <GoogleSignInButton
        label={t("login.continueGoogle", "Continue with Google")}
        onError={(m) => setError(m || t("form.google_auth_failed", "Google authentication failed"))}
      />

      <View style={styles.orRow}>
        <View style={styles.line} />
        <Text style={styles.or}>{t("login.or", "or")}</Text>
        <View style={styles.line} />
      </View>

      <Field
        label={t("form.email", "Email")}
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
      />
      <Field
        label={t("form.password", "Password")}
        icon="lock-closed-outline"
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

      {/* Prominent circular biometric button — only when enabled + a session exists. */}
      {canBiometric ? (
        <View style={styles.bioBlock}>
          <Pressable
            style={({ pressed }) => [styles.bioCircle, pressed && { transform: [{ scale: 0.96 }] }]}
            onPress={runBiometric}
            disabled={bioBusy}
            accessibilityRole="button"
            accessibilityLabel={t("biometric.unlockWith", "Unlock with {{method}}", { method: bioMethod })}
          >
            {bioBusy ? <ActivityIndicator color={theme.primary} /> : <Ionicons name={bioIcon} size={40} color={theme.primary} />}
          </Pressable>
          <Text style={styles.bioLabel}>{t("biometric.unlockWith", "Unlock with {{method}}", { method: bioMethod })}</Text>
          {bioError ? <Text style={styles.bioError}>{bioError}</Text> : null}
        </View>
      ) : null}

      <AppButton title={t("login.logIn", "Log In")} onPress={onSubmit} loading={loading} />

      {/* When locked, offer the full security exit (clears session + biometric → switch account). */}
      {isLocked ? (
        <Pressable onPress={onSwitchAccount} style={styles.switchAccount}>
          <Text style={styles.switchAccountText}>{t("login.switchAccount", "Sign out completely")}</Text>
        </Pressable>
      ) : null}
    </AuthCard>
  );
}

const makeStyles = (theme, isRTL) =>
  StyleSheet.create({
    forgot: { alignSelf: isRTL ? "flex-start" : "flex-end" },
    link: { color: theme.primary, fontWeight: "700" },
    footerText: { color: theme.textSecondary, fontSize: 14 },
    orRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 2 },
    line: { flex: 1, height: 1, backgroundColor: theme.border },
    or: { color: theme.textMuted, fontSize: 12 },
    // Biometric block
    bioBlock: { alignItems: "center", gap: 8, marginTop: 2 },
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
    switchAccount: { alignSelf: "center", paddingVertical: 6, marginTop: 2 },
    switchAccountText: { color: theme.textMuted, fontSize: 13, fontWeight: "700" },
  });
