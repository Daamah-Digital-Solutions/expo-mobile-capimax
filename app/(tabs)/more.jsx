import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../src/components/Screen";
import { useTheme } from "../../src/context/ThemeContext";
import { useAuth } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";

// More/Settings (foundation slice): auth state + login/logout, language switch (en/ar),
// and a TEMPORARY theme switch (auto/light/dark) for testing. The full settings screen
// (with the permanent theme + language UI) lands in Phase 9.
export default function MoreTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme, radius, mode, setMode } = useTheme();
  const { isAuthenticated, userEmail, signOut } = useAuth();
  const { language, isRTL, setLanguage } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, radius), [theme, radius]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{t("sidebar.more", "More")}</Text>

        {/* Account / auth */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t("sidebar.account", "Account")}</Text>
          <Text style={styles.status}>
            {isAuthenticated
              ? userEmail || t("myfunds.documentsVerified", "Signed in")
              : t("login.title", "Not signed in")}
          </Text>

          {isAuthenticated ? (
            <Pressable style={[styles.btn, styles.btnDanger]} onPress={signOut}>
              <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
              <Text style={styles.btnDangerText}>{t("logout", "Logout")}</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.btn} onPress={() => router.push("/(auth)/login")}>
              <Ionicons name="log-in-outline" size={18} color={theme.onPrimary} />
              <Text style={styles.btnText}>{t("login.title", "Login")}</Text>
            </Pressable>
          )}
        </View>

        {/* Theme switch (temporary — moves to Phase 9 settings) */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t("theme", "Theme")}</Text>
          <View style={styles.segRow}>
            <SegButton label={t("auto", "Auto")} icon="contrast-outline" active={mode === "auto"} onPress={() => setMode("auto")} styles={styles} theme={theme} />
            <SegButton label={t("light", "Light")} icon="sunny-outline" active={mode === "light"} onPress={() => setMode("light")} styles={styles} theme={theme} />
            <SegButton label={t("dark", "Dark")} icon="moon-outline" active={mode === "dark"} onPress={() => setMode("dark")} styles={styles} theme={theme} />
          </View>
          <Text style={styles.hint}>{t("theme", "Theme")}: {theme.name.toUpperCase()} · mode: {mode}</Text>
        </View>

        {/* Language switch */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t("language", "Language")}</Text>
          <View style={[styles.segRow, isRTL && styles.segRowRTL]}>
            <SegButton label="English" active={language === "en"} onPress={() => setLanguage("en")} styles={styles} theme={theme} />
            <SegButton label="العربية" active={language === "ar"} onPress={() => setLanguage("ar")} styles={styles} theme={theme} />
          </View>
          <Text style={styles.hint}>{isRTL ? "RTL" : "LTR"} · {language.toUpperCase()}</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function SegButton({ label, icon, active, onPress, styles, theme }) {
  return (
    <Pressable onPress={onPress} style={[styles.seg, active && styles.segActive]}>
      {icon ? (
        <Ionicons name={icon} size={16} color={active ? theme.onPrimary : theme.textSecondary} />
      ) : null}
      <Text style={[styles.segText, active && styles.segTextActive]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (theme, radius) =>
  StyleSheet.create({
    content: { padding: 16, gap: 16 },
    heading: { color: theme.text, fontSize: 24, fontWeight: "800", marginTop: 8 },
    card: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: radius.card,
      padding: 16,
      gap: 12,
    },
    cardLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    status: { color: theme.text, fontSize: 16, fontWeight: "600" },
    btn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.primary,
      paddingVertical: 12,
      borderRadius: radius.sm,
    },
    btnText: { color: theme.onPrimary, fontWeight: "700", fontSize: 15 }, // on primary fill (rule #4)
    btnDanger: { backgroundColor: theme.error },
    btnDangerText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 }, // white for contrast on red
    segRow: { flexDirection: "row", gap: 10 },
    segRowRTL: { flexDirection: "row-reverse" },
    seg: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
    },
    segActive: { backgroundColor: theme.primary, borderColor: theme.primary },
    segText: { color: theme.textSecondary, fontWeight: "600" },
    segTextActive: { color: theme.onPrimary }, // on primary fill (rule #4)
    hint: { color: theme.textMuted, fontSize: 12 },
  });
