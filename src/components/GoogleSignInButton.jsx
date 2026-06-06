// "Continue with Google" — native Google Sign-In via @react-native-google-signin/google-signin.
//
// Why native (not expo-auth-session): Google blocks the implicit response_type=id_token browser
// flow for native (Android/iOS) OAuth clients, AND that flow's id_token audience would be the
// native client, which our backend rejects. The native SDK signs in with the device's Android/iOS
// client (package + SHA-1) and, with webClientId set as the server client id, returns an id_token
// whose `aud` = the WEB client id — exactly what the backend verifies.
//
// Flow on success: idToken → AuthContext.signInWithGoogle → POST /api/auth/google/ { credential:
// idToken } → store access+refresh → home (+ the one-time biometric enroll offer).
//
// Native module: requires a dev/EAS build. In Expo Go we show a disabled button with a note.
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, StyleSheet, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { isGoogleConfigured, googleClientIds } from "../auth/googleConfig";

// Native modules are unavailable in Expo Go (StoreClient) — gate the active button to real builds.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Map a raw backend Google error to a friendly, localized message.
function friendlyGoogleError(raw, t) {
  const r = (raw || "").toLowerCase();
  if (r.includes("credential is required")) return t("google.errRequired", "No Google credential received. Please try again.");
  if (r.includes("invalid or unverified email")) return t("google.errInvalidEmail", "We could not verify your Google email. Try another account.");
  return t("google.errGeneric", "Google sign-in failed. Please try again.");
}

export default function GoogleSignInButton({ label, onError, onSuccess }) {
  // Active only in a real build with the client ids present.
  const active = isGoogleConfigured() && !isExpoGo;
  return active ? (
    <NativeGoogleButton label={label} onError={onError} onSuccess={onSuccess} />
  ) : (
    <DisabledGoogleButton label={label} expoGo={isExpoGo} />
  );
}

function NativeGoogleButton({ label, onError, onSuccess }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // webClientId = the server (web) client id → the returned id_token's `aud` is the web client id,
  // which the backend verifies. iosClientId drives the iOS flow (Android uses package + SHA-1).
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: googleClientIds.webClientId,
      iosClientId: googleClientIds.iosClientId,
      scopes: ["openid", "email", "profile"],
      offlineAccess: false,
    });
  }, []);

  const onPress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const res = await GoogleSignin.signIn();
      if (res?.type === "cancelled") {
        setBusy(false);
        return; // user dismissed the picker — not an error
      }
      // v13+ shape: { type:'success', data:{ idToken, user, ... } }; older: top-level idToken.
      let idToken = res?.data?.idToken ?? res?.idToken;
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens?.idToken;
      }
      if (!idToken) {
        setBusy(false);
        onError?.(t("google.errRequired", "No Google credential received. Please try again."));
        return;
      }
      const result = await signInWithGoogle(idToken); // → POST /api/auth/google/ { credential: idToken }
      setBusy(false);
      if (result.status === "success") onSuccess?.(result);
      else onError?.(friendlyGoogleError(result.message, t));
    } catch (e) {
      setBusy(false);
      const code = e?.code;
      if (code === statusCodes.SIGN_IN_CANCELLED || code === statusCodes.IN_PROGRESS) return;
      if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        onError?.(t("google.errPlayServices", "Google Play services are unavailable or need an update."));
        return;
      }
      onError?.(t("google.errGeneric", "Google sign-in failed. Please try again."));
    }
  };

  return (
    <Pressable style={[styles.btn, busy && styles.disabled]} disabled={busy} onPress={onPress}>
      {busy ? (
        <ActivityIndicator color={theme.text} />
      ) : (
        <View style={styles.row}>
          <Ionicons name="logo-google" size={18} color={theme.text} />
          <Text style={styles.text}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

function DisabledGoogleButton({ label, expoGo }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const note = expoGo
    ? t("google.expoGoNote", "Google sign-in works in the installed app (not Expo Go).")
    : t("google.inactiveNote", "Google sign-in will be available soon.");
  return (
    <View style={{ gap: 6 }}>
      <Pressable style={[styles.btn, styles.disabled]} disabled>
        <View style={styles.row}>
          <Ionicons name="logo-google" size={18} color={theme.textSecondary} />
          <Text style={[styles.text, { color: theme.textSecondary }]}>{label}</Text>
        </View>
      </Pressable>
      <Text style={styles.note}>{note}</Text>
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
