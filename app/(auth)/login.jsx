import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../src/components/Screen";
import { useTheme } from "../../src/context/ThemeContext";

// Phase-1 placeholder. The real login form (email/password, Google, validation) is Phase 2.
export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Screen>
      <View style={styles.center}>
        {/* Badge is a primary fill → text uses onPrimary (rule #4). */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>CapiMax</Text>
        </View>
        <Text style={styles.title}>{t("login.title", "Login")}</Text>
        <Text style={styles.note}>Coming in Phase 2</Text>

        <Pressable style={styles.back} onPress={() => router.replace("/(tabs)/funds")}>
          <Ionicons name="arrow-back" size={18} color={theme.primaryLight} />
          <Text style={styles.backText}>{t("sidebar.funds", "Assets")}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 10 },
    badge: {
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
      marginBottom: 8,
    },
    badgeText: { color: theme.onPrimary, fontWeight: "700", letterSpacing: 1 },
    title: { color: theme.text, fontSize: 26, fontWeight: "800" },
    note: { color: theme.textSecondary, fontSize: 14 },
    back: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 24 },
    backText: { color: theme.primaryLight, fontSize: 15, fontWeight: "600" },
  });
