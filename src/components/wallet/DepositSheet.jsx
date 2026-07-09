// Deposit (client request) — a BottomSheet that presents the planned deposit methods
// (bank transfer / cryptocurrency / other) as a "coming soon" surface. There is NO deposit
// endpoint on the backend yet (Phase C), so this never calls the API and never invents one —
// it shows the structure the client asked for with an honest coming-soon state. Both themes + RTL.
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import BottomSheet from "../BottomSheet";
import Banner from "../Banner";
import AppButton from "../AppButton";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

export default function DepositSheet({ visible, onClose }) {
  const { t } = useTranslation();
  const { theme, type } = useTheme();
  const { isRTL } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, isRTL), [theme, isRTL]);

  const METHODS = [
    { key: "bank", icon: "business-outline", label: t("wallet.depositMethodBank", "Bank Transfer") },
    { key: "crypto", icon: "logo-bitcoin", label: t("wallet.depositMethodCrypto", "Cryptocurrency") },
    { key: "other", icon: "ellipsis-horizontal-circle-outline", label: t("wallet.depositMethodOther", "Other Methods") },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t("wallet.depositFunds", "Deposit Funds")}>
      <Banner type="info" message={t("wallet.depositComingSoon", "Deposits are coming soon.")} />

      <View style={{ gap: 10 }}>
        {METHODS.map((m) => (
          <View key={m.key} style={styles.methodRow}>
            <View style={styles.methodIcon}>
              <Ionicons name={m.icon} size={20} color={theme.textSecondary} />
            </View>
            <Text style={[type.body, { color: theme.text, flex: 1, textAlign: isRTL ? "right" : "left" }]}>{m.label}</Text>
            <View style={styles.soonPill}>
              <Text style={styles.soonPillText}>{t("common.comingSoon", "Soon")}</Text>
            </View>
          </View>
        ))}
      </View>

      <AppButton title={t("common.close", "Close")} variant="secondary" onPress={onClose} />
    </BottomSheet>
  );
}

const makeStyles = (theme, isRTL) =>
  StyleSheet.create({
    methodRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
      opacity: 0.85,
    },
    methodIcon: {
      width: 40,
      height: 40,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.textMuted + "1F",
    },
    soonPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: theme.textMuted + "22",
    },
    soonPillText: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
  });
