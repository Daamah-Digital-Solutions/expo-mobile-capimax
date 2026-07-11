// More / Settings (Phase 9) — the proper settings hub.
//   • Account: My Account / Edit Profile / Change Password / Logout (or Login when signed out).
//   • Support & Legal: Contact, FAQ, Document Center, Our Platforms, Terms, Statement, Policy.
//   • Appearance: theme (auto/light/dark) · Language: en/ar (RTL reload handled by LanguageContext).
//   • About: app name + version.
// Reads everything from context; design system; both modes + RTL.
import React, { useEffect, useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

import Screen from "../../src/components/Screen";
import Logo from "../../src/components/Logo";
import Card from "../../src/components/Card";
import SegmentedControl from "../../src/components/SegmentedControl";
import AppButton from "../../src/components/AppButton";
import FadeInView from "../../src/components/motion/FadeInView";
import { useTheme } from "../../src/context/ThemeContext";
import { useAuth } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { methodLabelKey } from "../../src/utils/biometrics";

export default function MoreTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme, radii, type, spacing, mode, setMode } = useTheme();
  const {
    isAuthenticated,
    userEmail,
    signOut,
    lockApp,
    biometric,
    biometricEnabled,
    enableBiometric,
    disableBiometric,
    refreshBiometricCapability,
  } = useAuth();

  // Full sign-out is destructive (removes the account + biometric from this device) → confirm,
  // then land on the Login screen so the back gesture can't return into the authenticated app.
  const doSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };
  const confirmSignOut = () => {
    Alert.alert(
      t("more.signOutTitle", "Sign out completely?"),
      t("more.signOutMsg", "This removes your account and biometric sign-in from this device. You'll need your email & password to sign in again."),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        { text: t("more.signOutCompletely", "Sign out completely"), style: "destructive", onPress: doSignOut },
      ]
    );
  };
  const { language, isRTL, setLanguage } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const version = Constants.expoConfig?.version || "1.0.0";

  // Re-probe biometric capability when opening Settings (the user may have enrolled since launch).
  useEffect(() => {
    refreshBiometricCapability?.();
  }, [refreshBiometricCapability]);

  const bioMethod = t(methodLabelKey(biometric?.kind), "biometrics");

  const onToggleBiometric = async (next) => {
    if (next) {
      const res = await enableBiometric({
        promptMessage: t("biometric.promptVerify", "Confirm it's you"),
        cancelLabel: t("biometric.cancel", "Cancel"),
      });
      if (!res?.success && res?.error === "not_available") {
        Alert.alert(t("biometric.notAvailable", "Biometric sign-in isn't available on this device."));
      }
      // Other failures (e.g. user cancel) simply leave the toggle off.
    } else {
      await disableBiometric();
    }
  };

  // Coming-soon support channels (WhatsApp number + Live Chat provider are pending from the owner).
  const comingSoon = (label) => Alert.alert(label, t("common.comingSoonMsg", "This feature is coming soon."));

  const CONTACT_LINKS = [
    { icon: "chatbubbles-outline", label: t("contact.title", "Contact Us"), route: "/contact" },
    { icon: "logo-whatsapp", label: t("more.whatsapp", "WhatsApp"), soon: true },
    { icon: "chatbox-ellipses-outline", label: t("more.liveChat", "Live Chat"), route: "/chat" },
  ];

  const SUPPORT_LINKS = [
    { icon: "information-circle-outline", label: t("about.title", "About Us"), route: "/about" },
    { icon: "ribbon-outline", label: t("verification.title", "Verification"), route: "/verification" },
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
        <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
          <Logo height={20} />
        </View>
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
                {biometricEnabled ? (
                  <>
                    {/* Lock keeps the session so biometrics can reopen it (bank-style). */}
                    <Pressable style={[styles.btn, styles.btnLock]} onPress={lockApp}>
                      <Ionicons name="lock-closed-outline" size={18} color={theme.onPrimary} />
                      <Text style={styles.btnLockText}>{t("more.lock", "Lock")}</Text>
                    </Pressable>
                    <Text style={styles.exitHint}>{t("more.lockHint", "Lock the app; reopen quickly with {{method}}. You stay signed in.", { method: bioMethod })}</Text>

                    <Pressable style={[styles.btn, styles.btnDangerOutline]} onPress={confirmSignOut}>
                      <Ionicons name="log-out-outline" size={18} color={theme.error} />
                      <Text style={styles.btnDangerOutlineText}>{t("more.signOutCompletely", "Sign out completely")}</Text>
                    </Pressable>
                    <Text style={styles.exitHint}>{t("more.signOutHint", "Sign out and remove your account from this device. You will need your email & password next time.")}</Text>
                  </>
                ) : (
                  <Pressable style={[styles.btn, styles.btnDanger]} onPress={confirmSignOut}>
                    <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.btnDangerText}>{t("logout", "Logout")}</Text>
                  </Pressable>
                )}
              </>
            ) : (
              <AppButton title={t("login.title", "Login")} icon="log-in-outline" onPress={() => router.push("/(auth)/login")} />
            )}
          </Card>
        </FadeInView>

        {/* Security — biometric quick-unlock (only when the device has the hardware) */}
        {isAuthenticated && biometric?.hasHardware ? (
          <FadeInView index={1}>
            <Card style={{ gap: 10 }}>
              <Text style={[type.caption, styles.sectionLabel]}>{t("biometric.security", "Security")}</Text>
              <View style={styles.bioRow}>
                <Ionicons
                  name={biometric?.kind === "face" ? "scan-outline" : "finger-print-outline"}
                  size={22}
                  color={theme.primary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[type.body, { color: theme.text, fontWeight: "600", textAlign: isRTL ? "right" : "left" }]}>
                    {t("biometric.settingsTitle", "Biometric sign-in")}
                  </Text>
                  <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>
                    {t("biometric.settingsHint", "Unlock the app with {{method}}.", { method: bioMethod })}
                  </Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={onToggleBiometric}
                  trackColor={{ true: theme.primary, false: theme.border }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </Card>
          </FadeInView>
        ) : null}

        {/* Contact & Support — Contact form (live) + WhatsApp / Live Chat (coming soon) */}
        <FadeInView index={2}>
          <Card style={{ gap: 0 }}>
            <Text style={[type.caption, styles.sectionLabel, { marginBottom: 4 }]}>{t("more.contactSupport", "Contact & Support")}</Text>
            {CONTACT_LINKS.map((l, i) => (
              <Row
                key={l.label}
                icon={l.icon}
                label={l.label}
                soon={l.soon}
                soonLabel={t("common.comingSoon", "Soon")}
                onPress={() => (l.soon ? comingSoon(l.label) : router.push(l.route))}
                styles={styles}
                theme={theme}
                type={type}
                isRTL={isRTL}
                first={i === 0}
              />
            ))}
          </Card>
        </FadeInView>

        {/* Support & Legal */}
        <FadeInView index={3}>
          <Card style={{ gap: 0 }}>
            <Text style={[type.caption, styles.sectionLabel, { marginBottom: 4 }]}>{t("more.supportLegal", "Support & Legal")}</Text>
            {SUPPORT_LINKS.map((l, i) => (
              <Row key={l.route} icon={l.icon} label={l.label} onPress={() => router.push(l.route)} styles={styles} theme={theme} type={type} isRTL={isRTL} first={i === 0} />
            ))}
          </Card>
        </FadeInView>

        {/* Appearance */}
        <FadeInView index={4}>
          <Card style={{ gap: 10 }}>
            <Text style={[type.caption, styles.sectionLabel]}>{t("theme", "Theme")}</Text>
            <SegmentedControl segments={themeSegments} value={mode} onChange={setMode} />
          </Card>
        </FadeInView>

        {/* Language */}
        <FadeInView index={5}>
          <Card style={{ gap: 10 }}>
            <Text style={[type.caption, styles.sectionLabel]}>{t("language", "Language")}</Text>
            <SegmentedControl segments={langSegments} value={language} onChange={setLanguage} />
          </Card>
        </FadeInView>

        {/* About */}
        <FadeInView index={6}>
          <Card style={styles.aboutCard}>
            <Ionicons name="information-circle-outline" size={18} color={theme.textMuted} />
            <Text style={[type.caption, { color: theme.textMuted, flex: 1, textAlign: isRTL ? "right" : "left" }]}>
              {Constants.expoConfig?.name || "Capimax Assets"} · {t("more.version", "Version")} {version}
            </Text>
          </Card>
        </FadeInView>
      </ScrollView>
    </Screen>
  );
}

function Row({ icon, label, onPress, styles, theme, type, isRTL, first, soon, soonLabel }) {
  return (
    <Pressable style={[styles.row, first && { borderTopWidth: 0 }]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={soon ? theme.textSecondary : theme.primary} />
      <Text style={[type.body, { color: theme.text, flex: 1, textAlign: isRTL ? "right" : "left" }]}>{label}</Text>
      {soon ? (
        <View style={styles.soonPill}><Text style={styles.soonPillText}>{soonLabel}</Text></View>
      ) : (
        <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={theme.textMuted} />
      )}
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
    btnLock: { backgroundColor: theme.primary },
    btnLockText: { color: theme.onPrimary, fontWeight: "700", fontSize: 15 },
    btnDangerOutline: { backgroundColor: "transparent", borderWidth: 1, borderColor: theme.error, marginTop: 8 },
    btnDangerOutlineText: { color: theme.error, fontWeight: "700", fontSize: 15 },
    exitHint: { color: theme.textMuted, fontSize: 12, lineHeight: 16, textAlign: isRTL ? "right" : "left", marginTop: 6, paddingHorizontal: 2 },
    aboutCard: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10 },
    bioRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 },
    soonPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: theme.textMuted + "22" },
    soonPillText: { color: theme.textMuted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  });
