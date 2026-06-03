// "Continue with Google" button.
// - When Google is configured (app.json extra.google.*): uses expo-auth-session to get a Google
//   idToken and sends it to the backend as `credential` via AuthContext.signInWithGoogle.
// - When NOT configured (current state — OQ#10 deferred): renders a disabled button with a note.
import React, { useEffect, useMemo } from "react";
import { Pressable, Text, StyleSheet, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { isGoogleConfigured, googleClientIds } from "../auth/googleConfig";

WebBrowser.maybeCompleteAuthSession();

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
  const { theme } = useTheme();
  const { signInWithGoogle } = useAuth();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(googleClientIds);

  useEffect(() => {
    (async () => {
      if (response?.type === "success") {
        const idToken = response.params?.id_token;
        if (!idToken) {
          onError?.("No Google credential returned");
          return;
        }
        const result = await signInWithGoogle(idToken); // sent to /api/auth/google/ as `credential`
        if (result.status === "success") onSuccess?.();
        else onError?.(result.message);
      } else if (response?.type === "error") {
        onError?.("Google sign-in was unsuccessful");
      }
    })();
  }, [response]);

  return (
    <Pressable
      style={[styles.btn, !request && styles.disabled]}
      disabled={!request}
      onPress={() => promptAsync()}
    >
      <View style={styles.row}>
        <Ionicons name="logo-google" size={18} color={theme.text} />
        <Text style={styles.text}>{label}</Text>
      </View>
    </Pressable>
  );
}

function DisabledGoogleButton({ label }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <Pressable
      style={[styles.btn, styles.disabled]}
      onPress={() =>
        Alert.alert("Google sign-in", "Google sign-in will be enabled once the OAuth client IDs are configured.")
      }
    >
      <View style={styles.row}>
        <Ionicons name="logo-google" size={18} color={theme.textSecondary} />
        <Text style={[styles.text, { color: theme.textSecondary }]}>{label}</Text>
      </View>
    </Pressable>
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
  });
