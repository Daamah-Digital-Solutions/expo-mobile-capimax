// Step 3 — Contract (gateway payments only: PayPal + NOWPayments), per Flow D step 3.
//   POST /api/contracts/create/  -> contract_id
//   GET  /api/contracts/{id}/    -> contract_html (WebView) + contract_summary
//   POST /api/contracts/{id}/sign/ { signature_data }  (typed signature)
// A 400 whose body has current_status 'signed'/'completed' counts as success (idempotent).
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Platform, useWindowDimensions } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import Card from "../Card";
import AppButton from "../AppButton";
import Banner from "../Banner";
import Field from "../Field";
import SectionHeader from "../SectionHeader";
import FadeInView from "../motion/FadeInView";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { contractService } from "../../api/services";

export default function ContractStep({ rail, opportunityId, payment, total, onSigned }) {
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const [phase, setPhase] = useState("creating"); // creating | review | error
  const [contractId, setContractId] = useState(null);
  const [contractHtml, setContractHtml] = useState("");
  const [contractSummary, setContractSummary] = useState("");
  const [typedName, setTypedName] = useState("");
  const [error, setError] = useState("");
  const [signing, setSigning] = useState(false);

  const createAndLoad = async () => {
    setPhase("creating");
    setError("");
    try {
      const createRes = await contractService.create({
        contract_type: "investment",
        investment_opportunity_id: opportunityId,
        payment_transaction_id: payment?.transaction_id,
        investment_amount: Number(total) || 0,
      });
      if (!createRes?.data?.success || !createRes?.data?.contract_id) {
        throw new Error(createRes?.data?.error || t("buyFlow.contractFailed", "Failed to create contract"));
      }
      const id = createRes.data.contract_id;
      setContractId(id);
      const detail = await contractService.get(id);
      setContractSummary(detail?.data?.contract_summary || "");
      setContractHtml(detail?.data?.contract_html || "");
      setPhase("review");
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || t("buyFlow.contractFailed", "Failed to create contract"));
      setPhase("error");
    }
  };

  useEffect(() => {
    createAndLoad();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const finalize = () => {
    onSigned({
      contractId,
      contractSummary,
      signedAt: new Date().toLocaleString(),
    });
  };

  const sign = async () => {
    if (!typedName.trim()) return;
    setSigning(true);
    setError("");
    const signatureData = {
      method: "typed",
      typed_name: typedName.trim(),
      font: "cursive",
      signed_at: new Date().toISOString(),
      device: `${Platform.OS} ${Platform.Version}`,
      screen_size: `${Math.round(width)}x${Math.round(height)}`,
    };
    try {
      const res = await contractService.sign(contractId, signatureData);
      if (res?.data?.success) {
        setSigning(false);
        finalize();
      } else {
        setSigning(false);
        setError(t("buyFlow.signFailed", "Failed to sign contract. Please try again."));
      }
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data || {};
      // Idempotency: a previous attempt already went through.
      if (status === 400 && (data.current_status === "signed" || data.current_status === "completed")) {
        setSigning(false);
        finalize();
        return;
      }
      setSigning(false);
      setError(data.detail || data.error || err?.message || t("buyFlow.signFailed", "Failed to sign contract. Please try again."));
    }
  };

  if (phase === "creating") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.primary} size="large" />
        <Text style={[type.body, { color: theme.textSecondary, textAlign: "center" }]}>
          {t("buyFlow.preparingContract", "Preparing your contract…")}
        </Text>
      </View>
    );
  }

  if (phase === "error") {
    return (
      <View style={styles.center}>
        <Banner type="error" message={error} actionLabel={t("common.retry", "Retry")} onAction={createAndLoad} />
      </View>
    );
  }

  const htmlDoc = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{margin:0;padding:14px;font-family:-apple-system,Roboto,Arial,sans-serif;color:#111;background:#fff;font-size:14px;line-height:1.5;} img{max-width:100%;}</style>
</head><body>${contractHtml || ""}</body></html>`;

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40, gap: 18 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {rail}

      {contractSummary ? (
        <FadeInView index={0}>
          <Banner type="info" message={contractSummary} />
        </FadeInView>
      ) : null}

      <FadeInView index={1} style={{ gap: 10 }}>
        <SectionHeader title={t("buyFlow.contractTitle", "Your contract")} />
        <Card padded={false} style={{ overflow: "hidden" }}>
          <View style={{ height: 360, backgroundColor: "#fff" }}>
            <WebView
              originWhitelist={["*"]}
              source={{ html: htmlDoc }}
              javaScriptEnabled={false}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webLoading}><ActivityIndicator color={theme.primary} /></View>
              )}
            />
          </View>
        </Card>
      </FadeInView>

      <FadeInView index={2} style={{ gap: 10 }}>
        <SectionHeader title={t("buyFlow.signTitle", "Sign electronically")} />
        <Card style={{ gap: 12 }}>
          <Field
            label={t("buyFlow.typeFullName", "Type your full legal name")}
            value={typedName}
            onChangeText={setTypedName}
            autoCapitalize="words"
            placeholder={t("buyFlow.fullNamePlaceholder", "Full legal name")}
          />
          {typedName.trim() ? (
            <View style={styles.signaturePreview}>
              <Text style={styles.signatureText}>{typedName.trim()}</Text>
            </View>
          ) : null}
          <View style={styles.legalRow}>
            <Ionicons name="lock-closed-outline" size={14} color={theme.textMuted} />
            <Text style={[type.caption, { color: theme.textMuted, flex: 1, textAlign: isRTL ? "right" : "left" }]}>
              {t("buyFlow.legalNotice", "By signing electronically, you agree your e-signature has the same legal effect as a handwritten one, and accept the investment terms and risks.")}
            </Text>
          </View>
          {error ? <Banner type="error" message={error} /> : null}
          <AppButton
            title={t("buyFlow.signComplete", "Sign & Complete")}
            icon="create-outline"
            loading={signing}
            disabled={!typedName.trim()}
            onPress={sign}
          />
        </Card>
      </FadeInView>
    </ScrollView>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 },
    webLoading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
    signaturePreview: {
      minHeight: 64,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
      paddingHorizontal: 12,
    },
    signatureText: {
      fontSize: 30,
      color: theme.text,
      fontStyle: "italic",
      // cursive-ish across platforms
      fontFamily: Platform.OS === "ios" ? "Snell Roundhand" : "cursive",
    },
    legalRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "flex-start", gap: 8 },
  });
