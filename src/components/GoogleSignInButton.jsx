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
        console.log("[GoogleSignIn][DEBUG] native signIn returned NO idToken; res=", JSON.stringify(res));
        onError?.("DEBUG: no idToken from Google");
        return;
      }

      // --- TEMPORARY DEBUG: decode the id_token to verify audience == webClientId ---
      try {
        const payloadJson = global.atob(idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"));
        const p = JSON.parse(payloadJson);
        const audOk = p.aud === googleClientIds.webClientId;
        console.log("[GoogleSignIn][DEBUG] idToken aud =", p.aud);
        console.log("[GoogleSignIn][DEBUG] expected webClientId =", googleClientIds.webClientId);
        console.log("[GoogleSignIn][DEBUG] aud == webClientId ?", audOk, "| iss =", p.iss, "| email =", p.email, "| email_verified =", p.email_verified);
      } catch (decErr) {
        console.log("[GoogleSignIn][DEBUG] idToken decode failed:", decErr?.message);
      }

      const result = await signInWithGoogle(idToken); // → POST /api/auth/google/ { credential: idToken }
      setBusy(false);
      if (result.status === "success") {
        onSuccess?.(result);
      } else {
        // TEMPORARY DEBUG: surface the RAW backend error instead of the friendly message.
        console.log("[GoogleSignIn][DEBUG] backend rejected → message:", result.message);
        onError?.("DEBUG backend: " + (result.message || "unknown"));
      }
    } catch (e) {
      setBusy(false);
      const code = e?.code;
      // TEMPORARY DEBUG: log the full native error and surface the real code/message.
      console.log("[GoogleSignIn][DEBUG] native error → code:", String(code), "| message:", e?.message);
      try { console.log("[GoogleSignIn][DEBUG] native error full:", JSON.stringify(e)); } catch {}
      if (code === statusCodes.SIGN_IN_CANCELLED || code === statusCodes.IN_PROGRESS) return;
      onError?.("DEBUG native: code=" + String(code) + " | " + (e?.message || "(no message)"));
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
