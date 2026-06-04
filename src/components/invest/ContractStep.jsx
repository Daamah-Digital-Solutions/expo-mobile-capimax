// Step 3 — Contract (runs for ALL payment methods), per Flow D step 3.
//   POST /api/contracts/create/  -> contract_id
//   GET  /api/contracts/{id}/    -> contract_html (WebView) + contract_summary
//   POST /api/contracts/{id}/sign/ { signature_data }  (typed signature)
// A 400 whose body has current_status 'signed'/'completed' counts as success (idempotent).
//
// Layout note: the contract WebView scrolls INTERNALLY inside a bounded flex region —
// it is deliberately NOT wrapped in a vertical ScrollView (that swallows the scroll
// gesture). The sign area sits in a KeyboardAvoidingView so the typed name + cursive
// preview stay visible above the keyboard.
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  useWindowDimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import AppButton from "../AppButton";
import Banner from "../Banner";
import Field from "../Field";
import SectionHeader from "../SectionHeader";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { contractService } from "../../api/services";

export default function ContractStep({ rail, opportunityId, payment, total, onSigned }) {
  const { t } = useTranslation();
  const { theme, radii, type } = useTheme();
  const { isRTL } = useLanguage();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
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
    onSigned({ contractId, contractSummary, signedAt: new Date().toLocaleString() });
  };

  const sign = async () => {
    if (!typedName.trim()) return;
    Keyboard.dismiss();
    setSigning(true);
    setError("");
    // Payload shape is unchanged (backend contract sign_contract).
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

  // Inject viewport + scroll-friendly CSS so the full contract is reachable.
  const htmlDoc = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2">
<style>
  html,body{margin:0;padding:14px 14px 28px;height:auto;min-height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;
    font-family:-apple-system,Roboto,Arial,sans-serif;color:#111;background:#fff;font-size:14px;line-height:1.55;}
  *{max-width:100%;box-sizing:border-box;} img{height:auto;}
  table{width:100%;border-collapse:collapse;} td,th{word-break:break-word;}
</style></head><body>${contractHtml || ""}</body></html>`;

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 52}
    >
      {/* Fixed top: progress rail + contract summary */}
      <View style={styles.topBlock}>
        {rail}
        {contractSummary ? <Banner type="info" message={contractSummary} /> : null}
        <SectionHeader title={t("buyFlow.contractTitle", "Your contract")} />
      </View>

      {/* Contract — scrolls INTERNALLY in a bounded flex region (no parent ScrollView) */}
      <View style={styles.contractWrap}>
        <WebView
          originWhitelist={["*"]}
          source={{ html: htmlDoc }}
          javaScriptEnabled={false}
          scrollEnabled
          nestedScrollEnabled
          showsVerticalScrollIndicator
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webLoading}><ActivityIndicator color={theme.primary} /></View>
          )}
          style={{ flex: 1, backgroundColor: "#fff" }}
        />
      </View>

      {/* Sign area — lifts with the keyboard; tap empty space to dismiss */}
      <Pressable onPress={Keyboard.dismiss} style={styles.signArea}>
        <View style={styles.signTitleRow}>
          <Text style={[type.label, { color: theme.text }]}>{t("buyFlow.signTitle", "Sign electronically")}</Text>
          <View style={styles.legalRow}>
            <Ionicons name="lock-closed-outline" size={13} color={theme.textMuted} />
            <Text style={[type.caption, { color: theme.textMuted }]}>{t("buyFlow.eSignShort", "Legally binding e-signature")}</Text>
          </View>
        </View>

        {typedName.trim() ? (
          <View style={styles.signaturePreview}>
            <Text style={styles.signatureText} numberOfLines={1}>{typedName.trim()}</Text>
          </View>
        ) : null}

        <Field
          label={t("buyFlow.typeFullName", "Type your full legal name")}
          value={typedName}
          onChangeText={setTypedName}
          autoCapitalize="words"
          placeholder={t("buyFlow.fullNamePlaceholder", "Full legal name")}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />

        {error ? <Banner type="error" message={error} /> : null}

        <AppButton
          title={t("buyFlow.signComplete", "Sign & Complete")}
          icon="create-outline"
          loading={signing}
          disabled={!typedName.trim()}
          onPress={sign}
        />
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    fill: { flex: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 },
    topBlock: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10, gap: 12 },

    contractWrap: {
      flex: 1,
      marginHorizontal: 20,
      borderRadius: radii.card,
      overflow: "hidden",
      backgroundColor: "#fff",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    webLoading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },

    signArea: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 12,
      gap: 10,
      backgroundColor: theme.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    signTitleRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    legalRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 5 },

    signaturePreview: {
      minHeight: 56,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
      paddingHorizontal: 12,
    },
    signatureText: {
      fontSize: 28,
      color: theme.text,
      fontStyle: "italic",
      fontFamily: Platform.OS === "ios" ? "Snell Roundhand" : "cursive",
    },
  });
