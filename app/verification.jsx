// Verification (client request) — a dedicated section in More listing the platform's institutional
// accreditations with direct external verification links, so any investor can verify the data
// themselves. Real codes/links come from the owner (src/constants/accreditations.js); until an
// item has a link we show a "coming soon" note rather than inventing one. Static content — no API.
import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../src/components/Screen";
import Card from "../src/components/Card";
import AppButton from "../src/components/AppButton";
import PartnerLogo from "../src/components/PartnerLogo";
import FadeInView from "../src/components/motion/FadeInView";
import { useTheme } from "../src/context/ThemeContext";
import { useLanguage } from "../src/context/LanguageContext";
import { ACCREDITATIONS } from "../src/constants/accreditations";

export default function VerificationScreen() {
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
      <Text style={[type.label, { color: theme.text }]}>{t("verification.title", "Verification")}</Text>
      <View style={styles.headerBack} />
    </View>
  );

  return (
    <Screen edges={["bottom"]}>
      {Header}
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40, gap: 14 }} showsVerticalScrollIndicator={false}>
        <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left", lineHeight: 20 }]}>
          {t("verification.subtitle", "Verify Capimax's institutional accreditations yourself.")}
        </Text>

        {ACCREDITATIONS.map((a, i) => (
          <FadeInView key={a.key} index={i}>
            <Card style={{ gap: 10 }}>
              <View style={styles.rowHead}>
                {a.logo ? (
                  <View style={styles.logoChip}><PartnerLogo name={a.logo} height={24} /></View>
                ) : (
                  <View style={styles.icon}><Ionicons name={a.icon} size={20} color={theme.primary} /></View>
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>{a.name}</Text>
                  <Text style={[type.caption, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left", lineHeight: 18 }]}>{t(`verification.${a.key}_desc`)}</Text>
                </View>
              </View>
              {a.code ? (
                <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{t("verification.code", "Code")}: {a.code}</Text>
              ) : null}
              {a.link ? (
                <AppButton title={t("verification.verifyLink", "Verify externally")} variant="secondary" fullWidth={false} icon="open-outline" onPress={() => Linking.openURL(a.link)} />
              ) : (
                <View style={styles.soon}>
                  <Ionicons name="time-outline" size={13} color={theme.textMuted} />
                  <Text style={[type.micro, { color: theme.textMuted }]}>{t("verification.linkComingSoon", "Verification link coming soon")}</Text>
                </View>
              )}
            </Card>
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
    rowHead: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "flex-start", gap: 12 },
    icon: { width: 40, height: 40, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: theme.primary + "1F" },
    logoChip: { backgroundColor: "#FFFFFF", borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8, minWidth: 56, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
    soon: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6, alignSelf: isRTL ? "flex-end" : "flex-start" },
  });
