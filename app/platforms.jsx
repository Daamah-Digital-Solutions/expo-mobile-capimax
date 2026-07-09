// Our Platforms (Phase 9) — sister platforms in the Capimax ecosystem (web components/
// platforms/OurPlatforms). Real names/URLs/descriptions; each card opens the platform site
// externally. Mirrors the web: a dark branded card holding the platform's real logo.
import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../src/components/Screen";
import PlatformLogo from "../src/components/PlatformLogo";
import FadeInView from "../src/components/motion/FadeInView";
import { useTheme } from "../src/context/ThemeContext";
import { useLanguage } from "../src/context/LanguageContext";
import { PLATFORMS } from "../src/constants/platforms";

export default function PlatformsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const open = async (url) => { try { await WebBrowser.openBrowserAsync(url); } catch {} };

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <Pressable style={styles.headerBack} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color={theme.text} />
      </Pressable>
      <Text style={[type.label, { color: theme.text }]}>{t("platforms.sectionTitle", "Our Platforms")}</Text>
      <View style={styles.headerBack} />
    </View>
  );

  return (
    <Screen edges={["bottom"]}>
      {Header}
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40, gap: 14 }} showsVerticalScrollIndicator={false}>
        <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{t("platforms.sectionSubtitle", "Explore the wider Capimax ecosystem.")}</Text>

        {PLATFORMS.map((p, i) => (
          <FadeInView key={p.key} index={i}>
            <Pressable onPress={() => open(p.url)}>
              <LinearGradient colors={[theme.surfaceAlt, theme.card]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, { borderColor: p.accent + "55" }]}>
                <LinearGradient colors={[p.accent + "2E", "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.glow} pointerEvents="none" />
                <View style={styles.topRow}>
                  <View style={[styles.tag, { backgroundColor: p.accent + "1F", borderColor: p.accent + "44" }]}>
                    <Text style={[styles.tagText, { color: p.accent }]} numberOfLines={1}>{t(`platforms.tags.${p.key}`)}</Text>
                  </View>
                  <Ionicons name="open-outline" size={18} color={theme.textMuted} />
                </View>
                <View style={styles.logoBox}>
                  <PlatformLogo logo={p.logo} boxW={200} boxH={54} />
                </View>
                <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                <Text style={[styles.url, { color: p.accent }]} numberOfLines={1}>{p.url.replace(/^https?:\/\//, "")}</Text>
                <Text style={styles.desc}>{t(`platforms.descriptions.${p.key}`)}</Text>
              </LinearGradient>
            </Pressable>
          </FadeInView>
        ))}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    header: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 8 },
    headerBack: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
    card: { borderRadius: radii.card, padding: 18, gap: 11, borderWidth: 1, overflow: "hidden" },
    glow: { position: "absolute", top: 0, left: 0, right: 0, height: 110 },
    topRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" },
    tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
    tagText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
    logoBox: { height: 82, borderRadius: 16, backgroundColor: "#121c30", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
    name: { color: theme.text, fontWeight: "800", fontSize: 18, textAlign: isRTL ? "right" : "left" },
    url: { fontSize: 12, fontFamily: "monospace", letterSpacing: 0.3, textAlign: isRTL ? "right" : "left", marginTop: -6 },
    desc: { color: theme.textSecondary, fontSize: 13, lineHeight: 20, textAlign: isRTL ? "right" : "left" },
  });
