// Legal documents (Phase 9) — one dynamic route for three web pages:
//   • terms-conditions (web pages/terms-conditions): opens a language-specific Google-Drive
//     PDF link (verbatim from the web — NOT inline text). No fetch.
//   • statement (web pages/legal): GET users/me → statement_url → open externally.
//   • policy-insurance (web pages/policy-insurance): GET users/me → policy_insurance_url.
// Opens externally via expo-web-browser (web uses target=_blank). Zero mock; loading/empty/error.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../../src/components/Screen";
import Card from "../../src/components/Card";
import Banner from "../../src/components/Banner";
import AppButton from "../../src/components/AppButton";
import Skeleton from "../../src/components/Skeleton";
import FadeInView from "../../src/components/motion/FadeInView";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { userService } from "../../src/api/services";

// Terms & Conditions Drive links — copied verbatim from web pages/terms-conditions.
const TERMS_LINKS = {
  en: "https://drive.google.com/file/d/11v2uOpXoCbPElNUakUwAJbfXPb6oi8qe/view?usp=drive_link",
  ar: "https://drive.google.com/file/d/1P3BUD9mhL4EZ4aWmEi-9eaq0Dr4GiPXf/view?usp=drive_link",
};

export default function LegalScreen() {
  const { type } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, radii, type: typo, spacing } = useTheme();
  const { isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const isTerms = type === "terms-conditions";
  const isPolicy = type === "policy-insurance";

  // Per-type config (titles/labels + which users/me URL to read).
  const cfg = isTerms
    ? { title: t("terms_conditions.title", "Terms & Conditions"), subtitle: t("terms_conditions.subtitle", "Read our terms and conditions"), icon: "document-text-outline", docLabel: t("terms_conditions.title", "Terms & Conditions"), action: t("terms_conditions.openDocument", "Open Document") }
    : isPolicy
      ? { title: t("policyInsurance.title", "Policy Insurance Document"), subtitle: t("policyInsurance.subtitle", "View and download your policy insurance document"), icon: "shield-checkmark-outline", urlKey: "policy_insurance_url", docLabel: t("policyInsurance.document", "Policy Insurance Document"), action: t("policyInsurance.download", "Download Policy Document"), noDoc: t("policyInsurance.noDocument", "No policy insurance document available."), error: t("policyInsurance.error", "Failed to load policy document. Please try again later.") }
      : { title: t("statement.title", "Statement Document"), subtitle: t("statement.subtitle", "View and download your statement document"), icon: "document-text-outline", urlKey: "statement_url", docLabel: t("statement.document", "Statement Document"), action: t("statement.download", "Download Statement"), noDoc: t("statement.noDocument", "No statement document available."), error: t("statement.error", "Failed to load statement document. Please try again later.") };

  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(!isTerms);
  const [error, setError] = useState("");

  const fetchUrl = useCallback(async () => {
    setError("");
    try {
      const res = await userService.me();
      setUrl(res?.data?.[cfg.urlKey] || null);
    } catch (err) {
      setError(cfg.error);
      throw err;
    }
  }, [cfg.urlKey, cfg.error]);

  useEffect(() => {
    if (isTerms) return; // terms uses a static link, no fetch
    setLoading(true);
    fetchUrl().catch(() => {}).finally(() => setLoading(false));
  }, [isTerms, fetchUrl]);

  const open = async (link) => {
    if (!link) return;
    try { await WebBrowser.openBrowserAsync(link); } catch {}
  };

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <Pressable style={styles.headerBack} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color={theme.text} />
      </Pressable>
      <Text style={[typo.label, { color: theme.text }]} numberOfLines={1}>{cfg.title}</Text>
      <View style={styles.headerBack} />
    </View>
  );

  const renderBody = () => {
    // Terms & Conditions → static language-specific link.
    if (isTerms) {
      const link = TERMS_LINKS[language] || TERMS_LINKS.en;
      return <DocCard icon={cfg.icon} label={cfg.docLabel} action={cfg.action} onPress={() => open(link)} theme={theme} typo={typo} styles={styles} />;
    }
    if (loading) {
      return <Skeleton width="100%" height={200} radius={radii.card} />;
    }
    if (error) {
      return <Banner type="error" message={error} actionLabel={t("common.retry", "Retry")} onAction={() => { setLoading(true); fetchUrl().catch(() => {}).finally(() => setLoading(false)); }} />;
    }
    if (!url) {
      return <Banner type="info" message={cfg.noDoc} />;
    }
    return <DocCard icon={cfg.icon} label={cfg.docLabel} action={cfg.action} onPress={() => open(url)} theme={theme} typo={typo} styles={styles} />;
  };

  return (
    <Screen edges={["bottom"]}>
      {Header}
      <View style={{ padding: spacing.xl, gap: 16, flex: 1 }}>
        <Text style={[typo.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{cfg.subtitle}</Text>
        <FadeInView index={0}>{renderBody()}</FadeInView>
      </View>
    </Screen>
  );
}

function DocCard({ icon, label, action, onPress, theme, typo, styles }) {
  return (
    <Card style={{ alignItems: "center", gap: 16, paddingVertical: 28 }}>
      <View style={styles.docBadge}><Ionicons name={icon} size={40} color={theme.primary} /></View>
      <Text style={[typo.h2, { color: theme.text, textAlign: "center" }]}>{label}</Text>
      <AppButton title={action} icon="open-outline" onPress={onPress} />
    </Card>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    header: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 8 },
    headerBack: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
    docBadge: { width: 84, height: 84, borderRadius: 42, backgroundColor: theme.primary + "22", alignItems: "center", justifyContent: "center" },
  });
