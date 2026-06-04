// Step 2 — Payment. All FIVE methods, matching the web dashboard exactly:
//   PayPal (WebView SDK) · Bank transfer · NovaPay · Crypto (manual / NOWPayments).
// Exact payloads + response handling + transaction_id resolution per API_AND_FLOWS §2.4.
//
// LIVE PAYMENTS — every method moves real money / records a real pending payment.
// Gateways (PayPal, NOWPayments) call onGatewaySuccess → contract step.
// Manual methods (bank/crypto/NovaPay) call onManualSuccess → pending completion.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import { useTranslation } from "react-i18next";

import Card from "../Card";
import AppButton from "../AppButton";
import Banner from "../Banner";
import Field from "../Field";
import Chip from "../Chip";
import SegmentedControl from "../SegmentedControl";
import FadeInView from "../motion/FadeInView";
import FilePickerButton from "./FilePickerButton";
import PayPalWebView from "./PayPalWebView";
import NowPaymentsWebView from "./NowPaymentsWebView";
import { BANK_ACCOUNTS, CRYPTO_CURRENCIES } from "./paymentData";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { investmentPaymentService } from "../../api/services";

const USD = (n) => `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const extra = Constants.expoConfig?.extra || {};

export default function PaymentStep({ rail, opportunityId, shares, total, base, fee, feePercentage, onGatewaySuccess, onManualSuccess }) {
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const amountStr = (Number(total) || 0).toFixed(2);
  const sharesStr = String(parseInt(shares, 10) || 0);

  const [method, setMethod] = useState("paypal"); // paypal | bank | novapay | crypto
  const [cryptoOption, setCryptoOption] = useState("manual"); // manual | nowpayments
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Manual-method form state
  const [bankId, setBankId] = useState(BANK_ACCOUNTS[0].id);
  const [bankRef, setBankRef] = useState("");
  const [bankFile, setBankFile] = useState(null);
  const [novaRef, setNovaRef] = useState("");
  const [novaFile, setNovaFile] = useState(null);
  const [cryptoCur, setCryptoCur] = useState("BNB");
  const [txHash, setTxHash] = useState("");
  const [cryptoFile, setCryptoFile] = useState(null);

  // Gateway overlays
  const [paypalOpen, setPaypalOpen] = useState(false);
  const [nowUrl, setNowUrl] = useState(null);
  const [nowStatus, setNowStatus] = useState("");
  const pollRef = useRef({ timer: null, deadline: 0, stopped: false });

  useEffect(() => () => stopPolling(), []); // cleanup on unmount

  const stopPolling = () => {
    pollRef.current.stopped = true;
    if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
    pollRef.current.timer = null;
  };

  const selectedBank = BANK_ACCOUNTS.find((b) => b.id === bankId) || BANK_ACCOUNTS[0];
  const selectedCur = CRYPTO_CURRENCIES.find((c) => c.value === cryptoCur) || CRYPTO_CURRENCIES[0];

  const fail = (msg) => {
    setSubmitting(false);
    setError(msg || t("payment.processingError", "Payment processing failed"));
  };

  // ── PayPal ─────────────────────────────────────────────────────────────────
  const onPaypalApproved = async (msg) => {
    setPaypalOpen(false);
    setSubmitting(true);
    setError("");
    try {
      const res = await investmentPaymentService.processPaypal(opportunityId, {
        orderId: msg.orderId,
        captureId: msg.captureId,
        shares: parseInt(shares, 10) || 0,
        amount: Number(total) || 0,
        paymentDetails: {
          status: msg.status,
          payer: msg.payer,
          capture: msg.capture,
          create_time: msg.create_time,
          update_time: msg.update_time,
        },
      });
      if (res?.data?.status === "success") {
        setSubmitting(false);
        onGatewaySuccess({
          transaction_id: res.data?.transaction_id || msg.captureId,
          paymentMethod: "PayPal",
          status: msg.status || "COMPLETED",
        });
      } else {
        fail(res?.data?.message || t("payment.serverValidationError", "Server validation failed"));
      }
    } catch (err) {
      // On a server (500) error the web voids/refunds the captured payment.
      if (err?.response?.status === 500) {
        try {
          await investmentPaymentService.refundPayment(msg.orderId);
        } catch {}
      }
      fail(err?.response?.data?.message || err?.message);
    }
  };

  // ── NOWPayments ──────────────────────────────────────────────────────────────
  const startNowPayments = async () => {
    setSubmitting(true);
    setError("");
    try {
      const origin = extra.webOrigin || "https://capimaxinvestment.com";
      const res = await investmentPaymentService.createNowPaymentsInvoice({
        opportunityId,
        shares: parseInt(shares, 10) || 0,
        amount: Number(total) || 0,
        success_url: `${origin}/payment-success`,
        cancel_url: `${origin}/payment/crypto/cancel`,
      });
      const data = res?.data;
      if (data?.status === "success" && data?.data?.hosted_url) {
        const invoiceId = data.data.invoice_id;
        setSubmitting(false);
        setNowStatus(t("payment.waitingForPayment", "Waiting for Payment"));
        setNowUrl(data.data.hosted_url);
        pollNowStatus(invoiceId);
      } else {
        fail(t("payment.invalidResponse", "Invalid response from server"));
      }
    } catch (err) {
      fail(err?.response?.data?.message || err?.message || t("payment.cryptoPaymentError", "Crypto payment error"));
    }
  };

  // Poll every 5s, give up after 30 minutes (matches web).
  const pollNowStatus = (invoiceId) => {
    pollRef.current.stopped = false;
    pollRef.current.deadline = 0; // set on first tick via counter
    let elapsed = 0;
    const tick = async () => {
      if (pollRef.current.stopped) return;
      try {
        const res = await investmentPaymentService.getNowPaymentsStatus(invoiceId);
        if (res?.data?.completed) {
          stopPolling();
          setNowUrl(null);
          onGatewaySuccess({ transaction_id: invoiceId, paymentMethod: "NOWPayments", status: "completed" });
          return;
        }
      } catch {
        // keep polling through transient errors until the deadline
      }
      elapsed += 5000;
      if (elapsed >= 30 * 60 * 1000) {
        stopPolling();
        return;
      }
      pollRef.current.timer = setTimeout(tick, 5000);
    };
    pollRef.current.timer = setTimeout(tick, 5000);
  };

  const closeNow = () => {
    stopPolling();
    setNowUrl(null);
  };

  // If the hosted checkout redirects to our success_url, treat as a completion hint
  // (polling remains the source of truth).
  const onNowNav = (url) => {
    if (url && url.includes("payment-success")) setNowStatus(t("payment.confirmingPayment", "Confirming Payment"));
  };

  // ── Manual proof submitters ──────────────────────────────────────────────────
  const submitBank = async () => {
    if (!bankFile || !bankRef) return setError(t("payment.provideTransferProof", "Please provide transfer proof and reference number"));
    setSubmitting(true);
    setError("");
    const fd = new FormData();
    fd.append("transfer_proof", bankFile);
    fd.append("reference_number", bankRef);
    fd.append("amount", amountStr);
    fd.append("shares", sharesStr);
    try {
      const res = await investmentPaymentService.processBankTransfer(opportunityId, fd);
      if (res?.data?.status === "success") {
        const d = res.data?.data || {};
        setSubmitting(false);
        onManualSuccess({
          transaction_id: d.investment_id || d.reference_number || "BANK_TRANSFER",
          paymentMethod: "Bank Transfer",
          status: "Processing",
        });
      } else {
        fail(res?.data?.message || t("payment.bankTransferError", "Bank transfer processing failed"));
      }
    } catch (err) {
      fail(err?.response?.data?.message || err?.message || t("payment.uploadError", "Failed to upload transfer proof"));
    }
  };

  const submitNova = async () => {
    if (!novaFile || !novaRef) return setError(t("payment.provideTransferProof", "Please provide transfer proof and reference number"));
    setSubmitting(true);
    setError("");
    const fd = new FormData();
    fd.append("transfer_proof", novaFile);
    fd.append("reference_number", novaRef);
    fd.append("amount", amountStr);
    fd.append("shares", sharesStr);
    try {
      const res = await investmentPaymentService.processNovaPay(opportunityId, fd);
      if (res?.data?.status === "success") {
        const d = res.data?.data || {};
        setSubmitting(false);
        onManualSuccess({
          transaction_id: d.novapay_transfer_id || d.investment_id || d.reference_number || "NOVAPAY",
          paymentMethod: "NovaPay",
          status: "Processing",
        });
      } else {
        fail(res?.data?.message || t("payment.novapayError", "NovaPay submission failed. Please try again."));
      }
    } catch (err) {
      fail(err?.response?.data?.message || err?.message || t("payment.uploadError", "Failed to upload transfer proof"));
    }
  };

  const submitCrypto = async () => {
    if (!cryptoFile || !txHash) return setError(t("payment.provideTransferProof", "Please provide transfer proof and reference number"));
    setSubmitting(true);
    setError("");
    const fd = new FormData();
    fd.append("transfer_proof", cryptoFile);
    fd.append("transaction_hash", txHash);
    fd.append("wallet_address", selectedCur.address);
    fd.append("network", selectedCur.network);
    fd.append("currency", selectedCur.value);
    fd.append("shares", sharesStr);
    fd.append("amount", amountStr);
    try {
      const res = await investmentPaymentService.processCryptoTransfer(opportunityId, fd);
      const data = res?.data;
      if (data && (data.status === "success" || data.id)) {
        const rd = data.data || data;
        setSubmitting(false);
        onManualSuccess({
          transaction_id: rd.transaction_hash || rd.transaction_id || txHash || "Pending Verification",
          paymentMethod: "crypto",
          status: "Pending Verification",
        });
      } else {
        fail(data?.message || t("payment.processingError", "Payment processing failed"));
      }
    } catch (err) {
      fail(err?.response?.data?.message || err?.message || t("payment.processingError", "Payment processing failed"));
    }
  };

  const copyAddress = async () => {
    await Clipboard.setStringAsync(selectedCur.address);
    setError("");
  };

  // ── Method panels ────────────────────────────────────────────────────────────
  const METHODS = [
    { key: "paypal", label: "PayPal", icon: "logo-paypal" },
    { key: "bank", label: t("investForm.bankTransfer", "Bank Transfer"), icon: "business-outline" },
    { key: "novapay", label: t("investForm.novapay", "NovaPay"), icon: "card-outline" },
    { key: "crypto", label: t("investForm.crypto", "Crypto"), icon: "logo-bitcoin" },
  ];

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40, gap: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {rail}

        {/* Method picker */}
        <FadeInView index={0} style={{ gap: 10 }}>
          <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>
            {t("payment.choosePaymentMethod", "Choose your payment method:")}
          </Text>
          <View style={styles.methodRow}>
            {METHODS.map((m) => (
              <Chip key={m.key} label={m.label} icon={m.icon} selected={method === m.key} onPress={() => { setMethod(m.key); setError(""); }} />
            ))}
          </View>
          {method === "crypto" ? (
            <SegmentedControl
              segments={[
                { label: t("investForm.manualCrypto", "Manual Transfer"), value: "manual" },
                { label: "NOWPayments", value: "nowpayments" },
              ]}
              value={cryptoOption}
              onChange={(v) => { setCryptoOption(v); setError(""); }}
            />
          ) : null}
        </FadeInView>

        {/* Summary */}
        <FadeInView index={1}>
          <Card style={{ gap: 0 }}>
            <Row label={t("investForm.numberOfShares", "Number of Shares")} value={sharesStr} styles={styles} theme={theme} type={type} isRTL={isRTL} first />
            <Row label={t("investForm.platformFee", "Platform fee") + ` (${feePercentage}%)`} value={USD(fee)} styles={styles} theme={theme} type={type} isRTL={isRTL} />
            <Row label={t("buyFlow.totalToPay", "Total to pay")} value={USD(total)} styles={styles} theme={theme} type={type} isRTL={isRTL} strong />
          </Card>
        </FadeInView>

        {error ? <Banner type="error" message={error} /> : null}

        {/* Method-specific panel */}
        <FadeInView index={2}>
          {method === "paypal" ? (
            <Card style={{ gap: 12 }}>
              <PanelHeader icon="logo-paypal" title="PayPal" theme={theme} type={type} isRTL={isRTL} />
              <Text style={[type.body, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
                {t("buyFlow.paypalNote", "You'll complete payment securely in PayPal. Card payments are supported.")}
              </Text>
              <AppButton title={t("buyFlow.payWithPaypal", "Pay with PayPal")} icon="logo-paypal" loading={submitting} onPress={() => { setError(""); setPaypalOpen(true); }} />
            </Card>
          ) : null}

          {method === "bank" ? (
            <Card style={{ gap: 12 }}>
              <PanelHeader icon="business-outline" title={t("payment.bankTransferDetails", "Bank Transfer Details")} theme={theme} type={type} isRTL={isRTL} />
              <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>
                {t("buyFlow.selectBankAccount", "Select an account, transfer the total, then upload your proof.")}
              </Text>
              <View style={styles.bankChips}>
                {BANK_ACCOUNTS.map((b) => (
                  <Chip key={b.id} label={`${b.label} · ${b.currency}`} selected={bankId === b.id} onPress={() => setBankId(b.id)} />
                ))}
              </View>
              <View style={styles.detailBox}>
                {selectedBank.fields.map((f) => (
                  <View key={f.key} style={styles.detailRow}>
                    <Text style={[type.caption, { color: theme.textMuted }]}>{f.label}</Text>
                    <Text selectable style={[type.caption, styles.detailValue, { color: theme.text }]}>{f.value}</Text>
                  </View>
                ))}
              </View>
              <Field label={t("payment.transferReferenceNumber", "Transfer Reference Number")} value={bankRef} onChangeText={setBankRef} autoCapitalize="characters" />
              <FilePickerButton file={bankFile} onPick={setBankFile} onError={setError} />
              <AppButton title={t("payment.submitTransferProof", "Submit Transfer Proof")} icon="cloud-upload-outline" loading={submitting} disabled={!bankFile || !bankRef} onPress={submitBank} />
            </Card>
          ) : null}

          {method === "novapay" ? (
            <Card style={{ gap: 12 }}>
              <PanelHeader icon="card-outline" title={t("payment.novapayDetails", "NovaPay Payment Details")} theme={theme} type={type} isRTL={isRTL} />
              <Banner type="info" message={t("payment.novapayInstructions", "Complete your payment via NovaPay, then upload the transfer proof and reference number below.")} />
              <Field label={t("payment.transferReferenceNumber", "Transfer Reference Number")} value={novaRef} onChangeText={setNovaRef} autoCapitalize="characters" />
              <FilePickerButton file={novaFile} onPick={setNovaFile} onError={setError} />
              <AppButton title={t("payment.submitNovapayProof", "Submit NovaPay Proof")} icon="cloud-upload-outline" loading={submitting} disabled={!novaFile || !novaRef} onPress={submitNova} />
            </Card>
          ) : null}

          {method === "crypto" && cryptoOption === "manual" ? (
            <Card style={{ gap: 12 }}>
              <PanelHeader icon="logo-bitcoin" title={t("payment.payWithCrypto", "Pay with Cryptocurrency")} theme={theme} type={type} isRTL={isRTL} />
              <View style={styles.curChips}>
                {CRYPTO_CURRENCIES.map((c) => (
                  <Chip key={c.value} label={c.value} selected={cryptoCur === c.value} onPress={() => setCryptoCur(c.value)} />
                ))}
              </View>
              <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>
                {t("buyFlow.network", "Network")}: {selectedCur.network}
              </Text>
              <View style={styles.detailBox}>
                <Text style={[type.caption, { color: theme.textMuted }]}>{t("payment.walletAddress", "Wallet Address")} ({selectedCur.value})</Text>
                <Text selectable style={[type.caption, { color: theme.text, fontFamily: "monospace", marginTop: 4 }]}>{selectedCur.address}</Text>
                <Pressable onPress={copyAddress} style={styles.copyBtn} hitSlop={6}>
                  <Ionicons name="copy-outline" size={15} color={theme.primaryDark} />
                  <Text style={[type.caption, { color: theme.primaryDark }]}>{t("payment.copyAddress", "Copy Address")}</Text>
                </Pressable>
              </View>
              <Banner type="warning" message={t("buyFlow.sendExactCrypto", "Send exactly {{amount}} worth of {{currency}} on the {{network}} network only.", { amount: USD(total), currency: selectedCur.value, network: selectedCur.network })} />
              <Field label={t("buyFlow.transactionHash", "Transaction Hash / ID")} value={txHash} onChangeText={setTxHash} autoCapitalize="none" />
              <FilePickerButton file={cryptoFile} onPick={setCryptoFile} onError={setError} />
              <AppButton title={t("payment.makePayment", "Make Payment")} icon="cloud-upload-outline" loading={submitting} disabled={!cryptoFile || !txHash} onPress={submitCrypto} />
            </Card>
          ) : null}

          {method === "crypto" && cryptoOption === "nowpayments" ? (
            <Card style={{ gap: 12 }}>
              <PanelHeader icon="logo-bitcoin" title="NOWPayments" theme={theme} type={type} isRTL={isRTL} />
              <Text style={[type.body, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
                {t("payment.nowpaymentsDescription", "You will be redirected to NOWPayments secure checkout to complete your payment with cryptocurrency.")}
              </Text>
              <Text style={[type.label, { color: theme.text }]}>{t("payment.amountToPay", "Amount to Pay")}: {USD(total)}</Text>
              <AppButton title={t("payment.continueWithCrypto", "Continue with Crypto")} icon="logo-bitcoin" loading={submitting} onPress={startNowPayments} />
            </Card>
          ) : null}
        </FadeInView>
      </ScrollView>

      {/* Gateway overlays */}
      {paypalOpen ? (
        <PayPalWebView
          clientId={extra.paypalClientId}
          currency={extra.paypalCurrency || "USD"}
          amount={Number(total) || 0}
          opportunityId={opportunityId}
          shares={parseInt(shares, 10) || 0}
          webOrigin={extra.webOrigin}
          onApproved={onPaypalApproved}
          onCancel={() => setPaypalOpen(false)}
          onError={(m) => { setPaypalOpen(false); setError(m); }}
        />
      ) : null}

      {nowUrl ? (
        <NowPaymentsWebView url={nowUrl} statusText={nowStatus} onClose={closeNow} onNavChange={onNowNav} />
      ) : null}
    </>
  );
}

function PanelHeader({ icon, title, theme, type, isRTL }) {
  return (
    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
      <Ionicons name={icon} size={18} color={theme.primary} />
      <Text style={[type.label, { color: theme.text }]}>{title}</Text>
    </View>
  );
}

function Row({ label, value, styles, theme, type, isRTL, first, strong }) {
  return (
    <View style={[styles.row, first && { borderTopWidth: 0 }]}>
      <Text style={[type.body, { color: theme.textSecondary, flexShrink: 1, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>{label}</Text>
      <Text style={[strong ? type.label : type.body, { color: theme.text, fontWeight: strong ? "700" : undefined }]}>{value}</Text>
    </View>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    methodRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: isRTL ? "flex-end" : "flex-start" },
    bankChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: isRTL ? "flex-end" : "flex-start" },
    curChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: isRTL ? "flex-end" : "flex-start" },
    detailBox: {
      borderRadius: radii.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
      padding: 12,
      gap: 0,
    },
    detailRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      paddingVertical: 6,
    },
    detailValue: { flexShrink: 1, textAlign: isRTL ? "left" : "right", direction: "ltr" },
    copyBtn: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 5, marginTop: 8, alignSelf: isRTL ? "flex-end" : "flex-start" },
    row: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 11,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
  });
