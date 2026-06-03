import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Screen from "../../src/components/Screen";
import { useTheme } from "../../src/context/ThemeContext";

// Placeholder Buy/payment target. The real 4-step invest flow (create → pay → sign → complete)
// is Phase 4. The auth gate + pendingRoute already route here correctly after login.
export default function InvestScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, type } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Screen edges={["bottom"]}>
      <Pressable style={[styles.back, { top: insets.top + 8 }]} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name="chevron-back" size={22} color={theme.text} />
      </Pressable>
      <View style={styles.center}>
        <Ionicons name="cart-outline" size={48} color={theme.primary} />
        <Text style={[type.h2, { color: theme.text }]}>{t("common.invest", "Buy")}</Text>
        <Text style={[type.body, { color: theme.textSecondary, textAlign: "center" }]}>
          {t("common.opportunities", "Asset")} #{String(id)}
        </Text>
        <Text style={[type.caption, { color: theme.textMuted }]}>Phase 4 — payment & contract flow</Text>
      </View>
    </Screen>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    back: { position: "absolute", left: 16, zIndex: 5, padding: 4 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 10 },
  });
