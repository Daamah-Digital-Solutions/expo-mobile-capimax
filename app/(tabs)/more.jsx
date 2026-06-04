// More / Settings (Phase 9) — the proper settings hub.
//   • Account: My Account / Edit Profile / Change Password / Logout (or Login when signed out).
//   • Support & Legal: Contact, FAQ, Document Center, Our Platforms, Terms, Statement, Policy.
//   • Appearance: theme (auto/light/dark) · Language: en/ar (RTL reload handled by LanguageContext).
//   • About: app name + version.
// Reads everything from context; design system; both modes + RTL.
import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

import Screen from "../../src/components/Screen";
import Card from "../../src/components/Card";
import SegmentedControl from "../../src/components/SegmentedControl";
import AppButton from "../../src/components/AppButton";
import FadeInView from "../../src/components/motion/FadeInView";
import { useTheme } from "../../src/context/ThemeContext";
import { useAuth } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";

export default function MoreTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme, radii, type, spacing, mode, setMode } = useTheme();
  const { isAuthenticated, userEmail, signOut } = useAuth();
  const { language, isRTL, setLanguage } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const version = Constants.expoConfig?.version || "1.0.0";

  const SUPPORT_LINKS = [
    { icon: "chatbubbles-outline", label: t("contact.title", "Contact Us"), route: "/contact" },
    { icon: "help-circle-outline", label: t("sidebar.faq", "FAQ"), route: "/faq" },
    { icon: "folder-open-outline", label: t("documentCenter.title", "Document Center"), route: "/document-center" },
    { icon: "grid-outline", label: t("platforms.sectionTitle", "Our Platforms"), route: "/platforms" },
    { icon: "document-text-outline", label: t("terms_conditions.title", "Terms & Conditions"), route: "/legal/terms-conditions" },
    { icon: "reader-outline", label: t("statement.title", "Statement Document"), route: "/legal/statement" },
    { icon: "shield-checkmark-outline", label: t("policyInsurance.title", "Policy Insurance Document"), route: "/legal/policy-insurance" },
  ];

  const themeSegments = [
    { label: t("auto", "Auto"), value: "auto" },
    { label: t("light", "Light"), value: "light" },
    { label: t("dark", "Dark"), value: "dark" },
  ];
  const langSegments = [
    { label: "English", value: "en" },
    { label: "العربية", value: "ar" },
  ];

  return (
    <Screen edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40, gap: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={[type.h1, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>{t("sidebar.more", "More")}</Text>

        {/* Account */}
        <FadeInView index={0}>
          <Card style={{ gap: 4 }}>
            <Text style={[type.caption, styles.sectionLabel]}>{t("sidebar.account", "Account")}</Text>
            <Text style={[type.body, { color: theme.text, fontWeight: "600", textAlign: isRTL ? "right" : "left", marginBottom: 4 }]}>
              {isAuthenticated ? (userEmail || t("account.title", "My Account")) : t("login.title", "Not signed in")}
            </Text>

            {isAuthenticated ? (
              <>
                <Row icon="person-circle-outline" label={t("account.title", "My Account")} onPress={() => router.push("/account")} styles={styles} theme={theme} type={type} isRTL={isRTL} first />
                <Row icon="wallet-outline" label={t("sidebar.wallet", "Wallet")} onPress={() => router.push("/wallet")} styles={styles} theme={theme} type={type} isRTL={isRTL} />
                <Row icon="create-outline" label={t("sidebar.edit_account", "Edit Profile")} onPress={() => router.push("/edit-profile")} styles={styles} theme={theme} type={type} isRTL={isRTL} />
                <Row icon="lock-closed-outline" label={t("changePassword.title", "Change Password")} onPress={() => router.push("/change-password")} styles={styles} theme={theme} type={type} isRTL={isRTL} />
                <Pressable style={[styles.btn, styles.btnDanger]} onPress={signOut}>
                  <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.btnDangerText}>{t("logout", "Logout")}</Text>
                </Pressable>
              </>
            ) : (
              <AppButton title={t("login.title", "Login")} icon="log-in-outline" onPress={() => router.push("/(auth)/login")} />
            )}
          </Card>
        </FadeInView>

        {/* Support & Legal */}
        <FadeInView index={1}>
          <Card style={{ gap: 0 }}>
            <Text style={[type.caption, styles.sectionLabel, { marginBottom: 4 }]}>{t("more.supportLegal", "Support & Legal")}</Text>
            {SUPPORT_LINKS.map((l, i) => (
              <Row key={l.route} icon={l.icon} label={l.label} onPress={() => router.push(l.route)} styles={styles} theme={theme} type={type} isRTL={isRTL} first={i === 0} />
            ))}
          </Card>
        </FadeInView>

        {/* Appearance */}
        <FadeInView index={2}>
          <Card style={{ gap: 10 }}>
            <Text style={[type.caption, styles.sectionLabel]}>{t("theme", "Theme")}</Text>
            <SegmentedControl segments={themeSegments} value={mode} onChange={setMode} />
          </Card>
        </FadeInView>

        {/* Language */}
        <FadeInView index={3}>
          <Card style={{ gap: 10 }}>
            <Text style={[type.caption, styles.sectionLabel]}>{t("language", "Language")}</Text>
            <SegmentedControl segments={langSegments} value={language} onChange={setLanguage} />
          </Card>
        </FadeInView>

        {/* About */}
        <FadeInView index={4}>
          <Card style={styles.aboutCard}>
            <Ionicons name="information-circle-outline" size={18} color={theme.textMuted} />
            <Text style={[type.caption, { color: theme.textMuted, flex: 1, textAlign: isRTL ? "right" : "left" }]}>
              {Constants.expoConfig?.name || "CapiMax"} · {t("more.version", "Version")} {version}
            </Text>
          </Card>
        </FadeInView>
      </ScrollView>
    </Screen>
  );
}

function Row({ icon, label, onPress, styles, theme, type, isRTL, first }) {
  return (
    <Pressable style={[styles.row, first && { borderTopWidth: 0 }]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={theme.primary} />
      <Text style={[type.body, { color: theme.text, flex: 1, textAlign: isRTL ? "right" : "left" }]}>{label}</Text>
      <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={theme.textMuted} />
    </Pressable>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    sectionLabel: { color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.8, textAlign: isRTL ? "right" : "left" },
    row: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 13,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    btn: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 13,
      borderRadius: radii.button,
      marginTop: 10,
    },
    btnDanger: { backgroundColor: theme.error },
    btnDangerText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
    aboutCard: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10 },
  });
