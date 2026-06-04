// FAQ (Phase 9) — static content from the faq.* translation keys (21 Q&A), accordion UI.
// Mirrors web pages/faq (single-open accordion, first item expanded by default).
import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../src/components/Screen";
import Card from "../src/components/Card";
import FadeInView from "../src/components/motion/FadeInView";
import { useTheme } from "../src/context/ThemeContext";
import { useLanguage } from "../src/context/LanguageContext";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COUNT = 21;

export default function FaqScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const [expanded, setExpanded] = useState(0);

  const items = useMemo(
    () => Array.from({ length: COUNT }, (_, i) => ({
      q: t(`faq.question${i + 1}`),
      a: t(`faq.answer${i + 1}`),
    })),
    [t]
  );

  const toggle = (i) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((p) => (p === i ? -1 : i));
  };

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <Pressable style={styles.headerBack} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color={theme.text} />
      </Pressable>
      <Text style={[type.label, { color: theme.text }]}>{t("faq.title", "FAQ")}</Text>
      <View style={styles.headerBack} />
    </View>
  );

  return (
    <Screen edges={["bottom"]}>
      {Header}
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40, gap: 12 }} showsVerticalScrollIndicator={false}>
        <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left", marginBottom: 2 }]}>{t("faq.subtitle", "Find answers to common questions")}</Text>

        {items.map((it, i) => {
          const open = expanded === i;
          return (
            <FadeInView key={i} index={Math.min(i, 8)}>
              <Card style={{ gap: open ? 10 : 0, paddingVertical: 14 }}>
                <Pressable onPress={() => toggle(i)} style={styles.qRow} hitSlop={4}>
                  <Text style={[type.label, { color: theme.text, flex: 1, textAlign: isRTL ? "right" : "left" }]}>{it.q}</Text>
                  <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={theme.textSecondary} />
                </Pressable>
                {open ? (
                  <Text style={[type.body, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left", lineHeight: 22 }]}>{it.a}</Text>
                ) : null}
              </Card>
            </FadeInView>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    header: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 8 },
    headerBack: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
    qRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10 },
  });
