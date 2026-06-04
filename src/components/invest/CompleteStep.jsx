// Step 4 — Complete (Flow D step 4). Terminal success screen, mirroring the web's
// payment-success page. Two variants:
//   • gateway (PayPal/NOWPayments): contract signed → "Payment Successful".
//   • manual (bank/crypto/NovaPay): proof submitted → pending verification/processing.
// No implicit refetch (matches web); user navigates to Holdings / Assets.
import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../Screen";
import Card from "../Card";
import AppButton from "../AppButton";
import FadeInView from "../motion/FadeInView";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

const USD = (n) => `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CompleteStep({ payment, contract, shares, total }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, isRTL), [theme, isRTL]);

  const signed = !!contract; // gateway path goes through the contract step
  const statusText = signed ? t("buyFlow.completed", "Completed") : payment?.status || t("buyFlow.pending", "Pending");

  const rows = [
    { label: t("paymentSuccess.transactionId", "Transaction ID"), value: String(payment?.transaction_id ?? "—") },
    { label: t("paymentSuccess.amount", "Amount"), value: USD(total) },
    { label: t("paymentSuccess.shares", "Shares"), value: String(shares ?? "—") },
    { label: t("buyFlow.method", "Payment Method"), value: payment?.paymentMethod ?? "—" },
    { label: t("paymentSuccess.status", "Status"), value: statusText },
  ];
  if (signed) {
    rows.push({ label: t("buyFlow.contractId", "Contract ID"), value: String(contract.contractId ?? "—") });
    if (contract.signedAt) rows.push({ label: t("buyFlow.signedAt", "Signed At"), value: String(contract.signedAt) });
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40, gap: 22, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <FadeInView index={0} style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: theme.primary + "22" }]}>
            <Ionicons name={signed ? "checkmark-circle" : "time"} size={56} color={signed ? theme.positive : theme.primary} />
          </View>
          <Text style={[type.h1, { color: theme.text, textAlign: "center" }]}>
            {signed ? t("paymentSuccess.congratulations", "Congratulations! Payment Successful!") : t("buyFlow.paymentSubmitted", "Payment submitted")}
          </Text>
          <Text style={[type.body, { color: theme.textSecondary, textAlign: "center" }]}>
            {signed
              ? t("paymentSuccess.checkEmail", "Check Your Email! Your purchase has been successfully processed.")
              : t("buyFlow.pendingNote", "Your payment was submitted and is awaiting verification. You'll be notified once it's confirmed.")}
          </Text>
        </FadeInView>

        <FadeInView index={1}>
          <Card style={{ gap: 0 }}>
            <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left", marginBottom: 6 }]}>
              {t("paymentSuccess.transactionDetails", "Transaction Details")}
            </Text>
            {rows.map((r, i) => (
              <View key={r.label} style={[styles.row, i === 0 && { borderTopWidth: 0 }]}>
                <Text style={[type.caption, { color: theme.textSecondary }]}>{r.label}</Text>
                <Text style={[type.label, styles.rowValue, { color: theme.text }]} numberOfLines={2} selectable>{r.value}</Text>
              </View>
            ))}
          </Card>
        </FadeInView>

        <View style={{ flex: 1 }} />

        <FadeInView index={2} style={{ gap: 10 }}>
          <AppButton title={t("paymentSuccess.viewInvestments", "View My Holdings")} icon="briefcase-outline" onPress={() => router.replace("/(tabs)/myfunds")} />
          <AppButton title={t("paymentSuccess.checkNewOpportunities", "Browse More Assets")} variant="secondary" onPress={() => router.replace("/(tabs)/funds")} />
        </FadeInView>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme, isRTL) =>
  StyleSheet.create({
    hero: { alignItems: "center", gap: 14, paddingTop: 24 },
    badge: { width: 92, height: 92, borderRadius: 46, alignItems: "center", justifyContent: "center" },
    row: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 11,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    rowValue: { flexShrink: 1, textAlign: isRTL ? "left" : "right" },
  });
