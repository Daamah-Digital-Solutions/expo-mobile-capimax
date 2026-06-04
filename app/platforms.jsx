// Our Platforms (Phase 9) — sister platforms in the Capimax ecosystem (web components/
// platforms/OurPlatforms). Real names/URLs/descriptions (verbatim); each card opens the
// platform site externally. Logos are web-only assets → an accent icon is used instead.
import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../src/components/Screen";
import Card from "../src/components/Card";
import FadeInView from "../src/components/motion/FadeInView";
import { useTheme } from "../src/context/ThemeContext";
import { useLanguage } from "../src/context/LanguageContext";

const PLATFORMS = [
  { key: "capimaxrt", name: "Capimax RT", url: "https://capimaxrt.tech", accent: "#818cf8", icon: "business-outline" },
  { key: "novadf", name: "Nova DeFi", url: "https://novadf.com", accent: "#22d3ee", icon: "git-network-outline" },
  { key: "pronovacrypto", name: "Pronova Crypto", url: "https://pronovacrypto.tech", accent: "#f59e0b", icon: "logo-bitcoin" },
];

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
              <Card style={{ gap: 12 }}>
                <View style={styles.platHead}>
                  <View style={[styles.platIcon, { backgroundColor: p.accent + "22" }]}>
                    <Ionicons name={p.icon} size={22} color={p.accent} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[type.h2, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>{p.name}</Text>
                    <Text style={[type.caption, { color: p.accent, textAlign: isRTL ? "right" : "left" }]}>{p.url.replace(/^https?:\/\//, "")}</Text>
                  </View>
                  <Ionicons name="open-outline" size={18} color={theme.textMuted} />
                </View>
                <Text style={[type.body, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left", lineHeight: 22 }]}>
                  {t(`platforms.descriptions.${p.key}`)}
                </Text>
              </Card>
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
    platHead: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 },
    platIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  });
