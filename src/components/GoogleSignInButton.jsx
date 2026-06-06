// "Continue with Google" button.
// - When configured (app.json extra.google.* — needs webClientId for audience + the platform's
//   native client id): uses expo-auth-session's Google provider to get a Google ID token, then
//   POSTs it to /api/auth/google/ as `credential` via AuthContext.signInWithGoogle → tokens → home.
// - When NOT configured: renders a disabled button with a small note (no code change to activate).
import React, { useEffect, useMemo } from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { isGoogleConfigured, googleClientIds } from "../auth/googleConfig";

WebBrowser.maybeCompleteAuthSession();

// Map a raw backend Google error to a friendly, localized message.
function friendlyGoogleError(raw, t) {
  const r = (raw || "").toLowerCase();
  if (r.includes("credential is required")) return t("google.errRequired", "No Google credential received. Please try again.");
  if (r.includes("invalid or unverified email")) return t("google.errInvalidEmail", "We could not verify your Google email. Try another account.");
  // Wrong issuer / wrong audience / token used too early / etc. → generic
  return t("google.errGeneric", "Google sign-in failed. Please try again.");
}

export default function GoogleSignInButton({ label, onError, onSuccess }) {
  const configured = isGoogleConfigured();
  // Hooks must run unconditionally, so we always render one of the two internal components.
  return configured ? (
    <ConfiguredGoogleButton label={label} onError={onError} onSuccess={onSuccess} />
  ) : (
    <DisabledGoogleButton label={label} />
  );
}

function ConfiguredGoogleButton({ label, onError, onSuccess }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { signInWithGoogle } = useAuth();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // webClientId sets the ID-token audience the backend verifies against; the native client id
  // (ios/android) drives the on-device OAuth flow + redirect scheme.
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: googleClientIds.webClientId,
    iosClientId: googleClientIds.iosClientId,
    androidClientId: googleClientIds.androidClientId,
  });

  useEffect(() => {
    (async () => {
      if (response?.type === "success") {
        const idToken = response.params?.id_token;
        if (!idToken) {
          onError?.(t("google.errRequired", "No Google credential received. Please try again."));
          return;
        }
        const result = await signInWithGoogle(idToken); // → POST /api/auth/google/ { credential: idToken }
        if (result.status === "success") onSuccess?.(result);
        else onError?.(friendlyGoogleError(result.message, t));
      } else if (response?.type === "error") {
        onError?.(t("google.errGeneric", "Google sign-in failed. Please try again."));
      }
    })();
  }, [response]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Pressable style={[styles.btn, !request && styles.disabled]} disabled={!request} onPress={() => promptAsync()}>
      <View style={styles.row}>
        <Ionicons name="logo-google" size={18} color={theme.text} />
        <Text style={styles.text}>{label}</Text>
      </View>
    </Pressable>
  );
}

function DisabledGoogleButton({ label }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={{ gap: 6 }}>
      <Pressable style={[styles.btn, styles.disabled]} disabled>
        <View style={styles.row}>
          <Ionicons name="logo-google" size={18} color={theme.textSecondary} />
          <Text style={[styles.text, { color: theme.textSecondary }]}>{label}</Text>
        </View>
      </Pressable>
      <Text style={styles.note}>{t("google.inactiveNote", "Google sign-in will be available soon.")}</Text>
    </View>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    btn: {
      borderRadius: 10,
      paddingVertical: 13,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    text: { color: theme.text, fontSize: 15, fontWeight: "600" },
    disabled: { opacity: 0.6 },
    note: { color: theme.textMuted, fontSize: 12, textAlign: "center" },
  });
