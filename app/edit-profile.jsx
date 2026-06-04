import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Screen from "../src/components/Screen";
import { useTheme } from "../src/context/ThemeContext";
import { useLanguage } from "../src/context/LanguageContext";

// Phase-8 placeholder. The real Edit/Complete-Profile screen (passport upload via
// users/complete_profile multipart) lands in Phase 8. The Buy-flow gate routes here when
// document_status.has_passport === false so the path exists end-to-end now.
export default function EditProfilePlaceholder() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, type } = useTheme();
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Screen edges={["bottom"]}>
      <Pressable style={[styles.back, { top: insets.top + 8 }]} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color={theme.text} />
      </Pressable>
      <View style={styles.center}>
        <Ionicons name="id-card-outline" size={48} color={theme.primary} />
        <Text style={[type.h2, { color: theme.text, textAlign: "center" }]}>{t("edit.title", "Complete Profile")}</Text>
        <Text style={[type.body, { color: theme.textSecondary, textAlign: "center" }]}>
          {t("investForm.completeProfileInfo", "Please complete your profile information")}
        </Text>
        <Text style={[type.caption, { color: theme.textMuted, textAlign: "center" }]}>Phase 8 — passport upload & profile editing</Text>
      </View>
    </Screen>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    back: { position: "absolute", left: 16, zIndex: 5, padding: 4 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 10 },
  });
