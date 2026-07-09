// About Us (client request) — a professional intro presenting Capimax as a global, integrated
// investment ecosystem (investment · financing · insurance · verification · digital assets · payments),
// linking the wider platform ecosystem. Copy is owner-reviewable (about.* locale keys). Static
// institutional content — no API. Both themes + RTL.
import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../src/components/Screen";
import Card from "../src/components/Card";
import Logo from "../src/components/Logo";
import FadeInView from "../src/components/motion/FadeInView";
import { useTheme } from "../src/context/ThemeContext";
import { useLanguage } from "../src/context/LanguageContext";

const PILLARS = [
  { key: "diversified", icon: "earth-outline" },
  { key: "ecosystem", icon: "git-network-outline" },
  { key: "trust", icon: "shield-checkmark-outline" },
  { key: "financing", icon: "cash-outline" },
];

export default function AboutScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <Pressable style={styles.headerBack} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color={theme.text} />
      </Pressable>
      <Text style={[type.label, { color: theme.text }]}>{t("about.title", "About Us")}</Text>
      <View style={styles.headerBack} />
    </View>
  );

  return (
    <Screen edges={["bottom"]}>
      {Header}
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <FadeInView index={0}>
          <LinearGradient colors={["#2ead6f", "#1f8a54"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroLogo}><Logo width={150} /></View>
            <Text style={[type.h2, styles.heroTitle]}>{t("about.headline", "A global investment ecosystem")}</Text>
            <Text style={[type.body, styles.heroSub]}>{t("about.intro", "")}</Text>
          </LinearGradient>
        </FadeInView>

        {/* Pillars */}
        {PILLARS.map((p, i) => (
          <FadeInView key={p.key} index={i + 1}>
            <Card style={styles.pillar}>
              <View style={styles.pillarIcon}><Ionicons name={p.icon} size={22} color={theme.primary} /></View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>{t(`about.${p.key}_title`)}</Text>
                <Text style={[type.caption, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left", lineHeight: 20 }]}>{t(`about.${p.key}_body`)}</Text>
              </View>
            </Card>
          </FadeInView>
        ))}

        {/* Mission + ecosystem CTA */}
        <FadeInView index={5}>
          <Card style={{ gap: 10 }}>
            <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>{t("about.mission_title", "Our mission")}</Text>
            <Text style={[type.body, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left", lineHeight: 22 }]}>{t("about.mission_body", "")}</Text>
            <Pressable style={styles.ecoRow} onPress={() => router.push("/platforms")}>
              <Ionicons name="grid-outline" size={18} color={theme.primary} />
              <Text style={[type.label, { color: theme.primary, flex: 1, textAlign: isRTL ? "right" : "left" }]}>{t("platforms.sectionTitle", "Our Platforms")}</Text>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={theme.textMuted} />
            </Pressable>
          </Card>
        </FadeInView>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    header: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 8 },
    headerBack: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
    hero: { borderRadius: radii.card, padding: 20, gap: 10 },
    heroLogo: { alignItems: "center", marginBottom: 4 },
    heroTitle: { color: "#ffffff", textAlign: "center" },
    heroSub: { color: "#ffffff", opacity: 0.9, textAlign: "center", lineHeight: 22 },
    pillar: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "flex-start", gap: 12 },
    pillarIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: theme.primary + "1F" },
    ecoRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10, paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
  });
