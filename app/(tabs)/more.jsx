import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../src/components/Screen";
import colors, { radius } from "../../src/theme/colors";
import { useAuth } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";

// More/Settings (foundation slice): auth state + login/logout, language switch (en/ar).
// The full More screen (support, FAQ, legal, document center, app info) lands in Phase 9.
export default function MoreTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, userEmail, signOut } = useAuth();
  const { language, isRTL, setLanguage } = useLanguage();

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
              <Ionicons name="log-out-outline" size={18} color={colors.text} />
              <Text style={styles.btnText}>{t("logout", "Logout")}</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.btn} onPress={() => router.push("/(auth)/login")}>
              <Ionicons name="log-in-outline" size={18} color={colors.text} />
              <Text style={styles.btnText}>{t("login.title", "Login")}</Text>
            </Pressable>
          )}
        </View>

        {/* Language switch */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t("language", "Language")}</Text>
          <View style={[styles.langRow, isRTL && styles.langRowRTL]}>
            <LangButton label="English" active={language === "en"} onPress={() => setLanguage("en")} />
            <LangButton label="العربية" active={language === "ar"} onPress={() => setLanguage("ar")} />
          </View>
          <Text style={styles.hint}>
            {isRTL ? "RTL" : "LTR"} · {language.toUpperCase()}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function LangButton({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.langBtn, active && styles.langBtnActive]}
    >
      <Text style={[styles.langText, active && styles.langTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  heading: { color: colors.text, fontSize: 24, fontWeight: "800", marginTop: 8 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 16,
    gap: 12,
  },
  cardLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  status: { color: colors.text, fontSize: 16, fontWeight: "600" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.sm,
  },
  btnDanger: { backgroundColor: colors.error },
  btnText: { color: colors.text, fontWeight: "700", fontSize: 15 },
  langRow: { flexDirection: "row", gap: 10 },
  langRowRTL: { flexDirection: "row-reverse" },
  langBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
  },
  langBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  langText: { color: colors.textSecondary, fontWeight: "600" },
  langTextActive: { color: colors.text },
  hint: { color: colors.textSecondary, fontSize: 12 },
});
