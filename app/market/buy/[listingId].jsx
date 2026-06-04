// Internal-market BUY (Flow F) — a step machine on a dedicated route, mirroring the web's
// purchase dialog (pages/internal-market handlePurchase).
//   1. purchase  POST /api/internal-market/purchase/ { listing_id, shares, payment_method }
//   2. branch by payment_method:
//      • wallet      → if payment.status==='completed' → contract → success
//      • bank_transfer → upload proof  POST /api/internal-market/bank-transfer-upload/ (pending)
//      • credit_card → PayPal capture  → POST /api/internal-market/paypal-complete/ → contract → success
//      • crypto      → NOWPayments (generic create-invoice, opportunityId:null) → contract → success
//   Contract (non-bank): POST /api/contracts/create/ { contract_type:'internal_market',
//     market_transaction_id } → GET → sign (reuses ContractStep via createPayload).
//   Success summary reads response.data.summary (§2.10).
//
// LIVE PAYMENTS — real money / real pending records, exactly like the Phase-4 Buy flow.
// Money fields can arrive as STRINGS → parseFloat before math (STATE §7).
import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../../../src/components/Screen";
import Card from "../../../src/components/Card";
import AppButton from "../../../src/components/AppButton";
import Banner from "../../../src/components/Banner";
import Field from "../../../src/components/Field";
import Badge from "../../../src/components/Badge";
import SectionHeader from "../../../src/components/SectionHeader";
import FadeInView from "../../../src/components/motion/FadeInView";
import Chip from "../../../src/components/Chip";
import ContractStep from "../../../src/components/invest/ContractStep";
import PayPalWebView from "../../../src/components/invest/PayPalWebView";
import NowPaymentsWebView from "../../../src/components/invest/NowPaymentsWebView";
import FilePickerButton from "../../../src/components/invest/FilePickerButton";
import { BANK_ACCOUNTS } from "../../../src/components/invest/paymentData";
import { useTheme } from "../../../src/context/ThemeContext";
import { useLanguage } from "../../../src/context/LanguageContext";
import { useAuth } from "../../../src/context/AuthContext";
import { internalMarketService, investmentPaymentService } from "../../../src/api/services";

const USD = (v) => `$${(parseFloat(v) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const extra = Constants.expoConfig?.extra || {};

const METHODS = [
  { key: "wallet", icon: "wallet-outline", title: "internalMarket.payWallet", titleDefault: "Wallet Balance", desc: "internalMarket.payWalletDesc", descDefault: "Use your current wallet balance" },
  { key: "bank_transfer", icon: "business-outline", title: "internalMarket.payBank", titleDefault: "Bank Transfer", desc: "internalMarket.payBankDesc", descDefault: "Transfer from your bank account" },
  { key: "credit_card", icon: "card-outline", title: "internalMarket.payCard", titleDefault: "Credit/Debit Card", desc: "internalMarket.payCardDesc", descDefault: "Pay with credit or debit card (PayPal)" },
  { key: "crypto", icon: "logo-bitcoin", title: "internalMarket.payCrypto", titleDefault: "Cryptocurrency", desc: "internalMarket.payCryptoDesc", descDefault: "Pay with crypto via NOWPayments" },
];

export default function MarketBuyScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const { isAuthenticated, setPendingRoute } = useAuth();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const listingId = params.listingId;
  const projectName = params.projectName || t("internalMarket.unknownAsset", "Unknown Asset");
  const price = parseFloat(params.pricePerShare) || 0;
  const maxShares = parseInt(params.sharesAvailable, 10) || 0;
  const sellerId = params.sellerId;

  const [step, setStep] = useState("shares"); // shares | payment | bank | contract | success
  const [shares, setShares] = useState("1");
  const [method, setMethod] = useState("wallet");
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [marketTxId, setMarketTxId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Bank-transfer upload form
  const [bankId, setBankId] = useState(BANK_ACCOUNTS[0].id);
  const [bankRef, setBankRef] = useState("");
  const [bankFile, setBankFile] = useState(null);

  // Gateway overlays
  const [paypalOpen, setPaypalOpen] = useState(false);
  const [nowUrl, setNowUrl] = useState(null);
  const [nowStatus, setNowStatus] = useState("");
  const pollRef = useRef({ timer: null, stopped: false });

  useEffect(() => () => stopPolling(), []);

  // Defensive auth gate (the market tab is already behind auth).
  useEffect(() => {
    if (!isAuthenticated) {
      setPendingRoute(`/market/buy/${listingId}`);
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopPolling = () => {
    pollRef.current.stopped = true;
    if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
    pollRef.current.timer = null;
  };

  const sharesNum = parseInt(shares, 10) || 0;
  const subtotal = sharesNum * price;
  // Prefer the backend-provided amount (authoritative for the live charge); fall back to
  // the client subtotal. See report note — the purchase response's `amount`/`summary` are
  // what we verify against the live API.
  const chargeAmount = (purchaseResult && parseFloat(purchaseResult.amount)) || subtotal;

  const selectedBank = BANK_ACCOUNTS.find((b) => b.id === bankId) || BANK_ACCOUNTS[0];

  const fail = (msg) => { setSubmitting(false); setError(msg || t("internalMarket.purchaseError", "Purchase failed")); };

  // ── Build the internal_market contract payload + finalize on sign ──────────────
  const contractPayload = marketTxId
    ? { contract_type: "internal_market", market_transaction_id: marketTxId }
    : null;
  const onSigned = () => setStep("success");

  // ── Step transition: shares → payment ─────────────────────────────────────────
  const goPayment = () => { setError(""); setStep("payment"); };

  // ── Execute purchase (from the payment step) ───────────────────────────────────
  const completePurchase = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await internalMarketService.purchase({
        listing_id: listingId,
        shares: sharesNum,
        payment_method: method,
      });
      const d = res?.data || {};
      const payment = d.payment || {};
      const txId = d.transaction?.transaction_id;
      setPurchaseResult(d);

      // Wallet completes immediately; other methods return a pending transaction.
      if (d.success && payment.status === "completed") {
        setSubmitting(false);
        setMarketTxId(txId);
        setSummary(d.summary || null);
        setStep("contract");
        return;
      }
      if (method === "wallet") {
        return fail(t("internalMarket.walletFailed", "Wallet payment failed. Please check your balance."));
      }
      if (method === "bank_transfer") {
        setSubmitting(false);
        setStep("bank");
        return;
      }
      if (method === "credit_card") {
        setSubmitting(false);
        setPaypalOpen(true);
        return;
      }
      if (method === "crypto") {
        startNowPayments(d);
        return;
      }
      fail(t("internalMarket.purchaseError", "Purchase failed"));
    } catch (err) {
      fail(err?.response?.data?.error || err?.response?.data?.message || err?.message);
    }
  };

  // ── PayPal (credit_card) ───────────────────────────────────────────────────────
  const onPaypalApproved = async (msg) => {
    setPaypalOpen(false);
    setSubmitting(true);
    setError("");
    try {
      const res = await internalMarketService.paypalComplete({
        transaction_id: purchaseResult?.transaction?.transaction_id,
        orderId: msg.orderId,
        captureId: msg.captureId,
        paymentStatus: msg.status,
      });
      if (res?.data?.success) {
        setSubmitting(false);
        setMarketTxId(res.data?.transaction?.transaction_id || purchaseResult?.transaction?.transaction_id);
        setSummary(res.data?.summary || purchaseResult?.summary || null);
        setStep("contract");
      } else {
        fail(t("internalMarket.purchaseError", "Payment processing failed"));
      }
    } catch (err) {
      fail(err?.response?.data?.error || err?.response?.data?.message || err?.message);
    }
  };

  // ── NOWPayments (crypto) — generic invoice (opportunityId:null) + polling ───────
  const startNowPayments = async (pr) => {
    setSubmitting(true);
    setError("");
    try {
      const origin = extra.webOrigin || "https://capimaxinvestment.com";
      const amount = (pr && parseFloat(pr.amount)) || subtotal;
      const res = await investmentPaymentService.createNowPaymentsInvoice({
        opportunityId: null,
        shares: sharesNum,
        amount,
        success_url: `${origin}/payment-success`,
        cancel_url: `${origin}/payment/crypto/cancel`,
      });
      const data = res?.data;
      if (data?.status === "success" && data?.data?.hosted_url) {
        setSubmitting(false);
        setNowStatus(t("payment.waitingForPayment", "Waiting for Payment"));
        setNowUrl(data.data.hosted_url);
        pollNowStatus(data.data.invoice_id, pr);
      } else {
        fail(t("payment.invalidResponse", "Invalid response from server"));
      }
    } catch (err) {
      fail(err?.response?.data?.message || err?.message || t("payment.cryptoPaymentError", "Crypto payment error"));
    }
  };

  const pollNowStatus = (invoiceId, pr) => {
    pollRef.current.stopped = false;
    let elapsed = 0;
    const tick = async () => {
      if (pollRef.current.stopped) return;
      try {
        const res = await investmentPaymentService.getNowPaymentsStatus(invoiceId);
        if (res?.data?.completed) {
          stopPolling();
          setNowUrl(null);
          onCryptoSuccess(invoiceId, pr);
          return;
        }
      } catch {
        // keep polling through transient errors until the deadline
      }
      elapsed += 5000;
      if (elapsed >= 30 * 60 * 1000) { stopPolling(); return; }
      pollRef.current.timer = setTimeout(tick, 5000);
    };
    pollRef.current.timer = setTimeout(tick, 5000);
  };

  const onCryptoSuccess = (invoiceId, pr) => {
    const result = pr || purchaseResult || {};
    setMarketTxId(result?.transaction?.transaction_id);
    // The generic NOWPayments path returns no summary → build a display summary (web parity).
    setSummary({
      transaction_id: invoiceId,
      seller_info: { project: projectName, seller_id: sellerId },
      shares_purchased: sharesNum,
      price_per_share: price,
      subtotal: subtotal,
      total_paid: (result && parseFloat(result.amount)) || subtotal,
      payment_method: "crypto",
      payment_status: "completed",
    });
    setStep("contract");
  };

  const closeNow = () => { stopPolling(); setNowUrl(null); setSubmitting(false); };
  const onNowNav = (url) => { if (url && url.includes("payment-success")) setNowStatus(t("payment.confirmingPayment", "Confirming Payment")); };

  // ── Bank-transfer proof upload ─────────────────────────────────────────────────
  const submitBankProof = async () => {
    if (!bankFile || !bankRef) return setError(t("payment.provideTransferProof", "Please provide transfer proof and reference number"));
    setSubmitting(true);
    setError("");
    const fd = new FormData();
    fd.append("transaction_id", purchaseResult?.transaction?.transaction_id);
    fd.append("reference_number", bankRef);
    fd.append("transfer_proof", bankFile);
    try {
      const res = await internalMarketService.bankTransferUpload(fd);
      if (res?.data?.success) {
        setSubmitting(false);
        setStep("bankPending");
      } else {
        fail(t("internalMarket.bankUploadError", "Failed to submit bank transfer proof"));
      }
    } catch (err) {
      fail(err?.response?.data?.error || err?.response?.data?.message || err?.message || t("internalMarket.bankUploadError", "Failed to submit bank transfer proof"));
    }
  };

  // ── Header ─────────────────────────────────────────────────────────────────────
  const titles = {
    shares: t("internalMarket.purchaseShares", "Purchase Shares"),
    payment: t("internalMarket.selectPaymentMethod", "Select Payment Method"),
    bank: t("internalMarket.bankTransfer", "Bank Transfer"),
    bankPending: t("internalMarket.bankTransfer", "Bank Transfer"),
    contract: t("buyFlow.contract", "Contract"),
    success: t("internalMarket.purchaseComplete", "Purchase Complete"),
  };
  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <Pressable style={styles.headerBack} onPress={onBack} hitSlop={8}>
        <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color={theme.text} />
      </Pressable>
      <Text style={[type.label, { color: theme.text }]}>{titles[step] || projectName}</Text>
      <View style={styles.headerBack} />
    </View>
  );

  function onBack() {
    if (step === "payment") return setStep("shares");
    if (step === "bank") return setStep("payment");
    router.back();
  }

  // ── Contract step (reuse ContractStep with the internal_market payload) ─────────
  if (step === "contract") {
    return (
      <Screen edges={["bottom"]}>
        {Header}
        <ContractStep rail={null} createPayload={contractPayload} onSigned={onSigned} />
      </Screen>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────────
  if (step === "success") {
    return <SuccessView summary={summary} sharesNum={sharesNum} subtotal={subtotal} projectName={projectName} sellerId={sellerId} price={price} router={router} t={t} theme={theme} type={type} spacing={spacing} isRTL={isRTL} styles={styles} />;
  }

  // ── Bank pending (terminal) ──────────────────────────────────────────────────────
  if (step === "bankPending") {
    return (
      <Screen edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: 22, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <FadeInView index={0} style={styles.hero}>
            <View style={[styles.badge, { backgroundColor: theme.primary + "22" }]}>
              <Ionicons name="document-text" size={56} color={theme.primary} />
            </View>
            <Text style={[type.h1, { color: theme.text, textAlign: "center" }]}>{t("internalMarket.proofSubmitted", "Transfer proof submitted")}</Text>
            <Text style={[type.body, { color: theme.textSecondary, textAlign: "center" }]}>
              {t("internalMarket.proofSubmittedMsg", "Your payment is pending verification. You'll be notified once an admin confirms it.")}
            </Text>
          </FadeInView>
          <View style={{ flex: 1 }} />
          <FadeInView index={1} style={{ gap: 10 }}>
            <AppButton title={t("internalMarket.backToMarket", "Back to Market")} icon="swap-horizontal-outline" onPress={() => router.replace("/(tabs)/market")} />
            <AppButton title={t("paymentSuccess.viewInvestments", "View My Holdings")} variant="secondary" onPress={() => router.replace("/(tabs)/myfunds")} />
          </FadeInView>
        </ScrollView>
      </Screen>
    );
  }

  // ── Step: shares ──────────────────────────────────────────────────────────────
  if (step === "shares") {
    const onInput = (txt) => {
      const digits = txt.replace(/[^0-9]/g, "");
      if (maxShares > 0 && parseInt(digits, 10) > maxShares) return setShares(String(maxShares));
      setShares(digits);
    };
    const valid = sharesNum >= 1 && sharesNum <= maxShares;
    return (
      <Screen edges={["bottom"]}>
        {Header}
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 + insets.bottom, gap: 18 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <FadeInView index={0}>
            <Card style={{ gap: 8 }}>
              <Text style={[type.h2, { color: theme.text, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>{projectName}</Text>
              <View style={styles.kvRow}>
                <Text style={[type.caption, { color: theme.textMuted }]}>{t("internalMarket.pricePerShare", "Price per Share")}</Text>
                <Text style={[type.label, { color: theme.text }]}>{USD(price)}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={[type.caption, { color: theme.textMuted }]}>{t("internalMarket.availableShares", "Available Shares")}</Text>
                <Text style={[type.label, { color: theme.text }]}>{maxShares}</Text>
              </View>
              {sellerId ? (
                <View style={styles.kvRow}>
                  <Text style={[type.caption, { color: theme.textMuted }]}>{t("internalMarket.seller", "Seller")}</Text>
                  <Badge label={`#${sellerId}`} tone="neutral" icon="person-outline" />
                </View>
              ) : null}
            </Card>
          </FadeInView>

          <FadeInView index={1} style={{ gap: 10 }}>
            <SectionHeader title={t("internalMarket.sharesToPurchase", "Shares to Purchase")} />
            <Field
              label={t("internalMarket.sharesToPurchase", "Shares to Purchase")}
              value={shares}
              onChangeText={onInput}
              keyboardType="number-pad"
              placeholder="1"
              error={maxShares > 0 && sharesNum > maxShares ? t("internalMarket.tooManySharesBuy", "Only {{count}} shares available", { count: maxShares }) : undefined}
            />
          </FadeInView>

          <FadeInView index={2}>
            <Card style={styles.totalCard}>
              <Text style={[type.label, { color: theme.textSecondary }]}>{t("internalMarket.totalCost", "Total Cost")}</Text>
              <Text style={[type.display, { color: theme.text }]}>{USD(subtotal)}</Text>
              <Text style={[type.caption, { color: theme.textMuted, textAlign: "center" }]}>{t("internalMarket.feeNote", "A platform fee may apply and is shown on confirmation.")}</Text>
            </Card>
          </FadeInView>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
          <AppButton title={t("common.continue", "Continue")} icon="arrow-forward" disabled={!valid} onPress={goPayment} />
        </View>
      </Screen>
    );
  }

  // ── Step: bank-transfer upload ────────────────────────────────────────────────
  if (step === "bank") {
    return (
      <Screen edges={["bottom"]}>
        {Header}
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 + insets.bottom, gap: 18 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <FadeInView index={0}>
            <Banner type="warning" message={t("internalMarket.bankInstructions", "Complete the bank transfer of {{amount}} to one of the accounts below, then upload your proof and reference number.", { amount: USD(chargeAmount) })} />
          </FadeInView>

          {/* Real platform bank accounts (same as the Phase-4 Buy flow) */}
          <FadeInView index={1} style={{ gap: 10 }}>
            <SectionHeader title={t("payment.bankTransferDetails", "Bank Transfer Details")} />
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
          </FadeInView>

          {error ? <Banner type="error" message={error} /> : null}

          <FadeInView index={2} style={{ gap: 12 }}>
            <Field label={t("payment.transferReferenceNumber", "Transfer Reference Number")} value={bankRef} onChangeText={setBankRef} autoCapitalize="characters" />
            <FilePickerButton file={bankFile} onPick={setBankFile} onError={setError} />
          </FadeInView>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
          <AppButton title={t("payment.submitTransferProof", "Submit Transfer Proof")} icon="cloud-upload-outline" loading={submitting} disabled={!bankFile || !bankRef} onPress={submitBankProof} />
        </View>
      </Screen>
    );
  }

  // ── Step: payment ─────────────────────────────────────────────────────────────
  return (
    <Screen edges={["bottom"]}>
      {Header}
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 + insets.bottom, gap: 18 }} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <FadeInView index={0}>
          <Card style={{ gap: 6 }}>
            <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>{projectName}</Text>
            <Text style={[type.body, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
              {sharesNum} {t("internalMarket.shares", "Shares")} × {USD(price)} = {USD(subtotal)}
            </Text>
          </Card>
        </FadeInView>

        {error ? <Banner type="error" message={error} /> : null}

        <FadeInView index={1} style={{ gap: 10 }}>
          <SectionHeader title={t("internalMarket.choosePaymentMethod", "Choose Payment Method")} />
          {METHODS.map((m) => {
            const active = method === m.key;
            return (
              <Pressable key={m.key} onPress={() => { setMethod(m.key); setError(""); }} style={[styles.method, active && styles.methodActive]}>
                <View style={[styles.radio, active && { borderColor: theme.primary }]}>{active ? <View style={styles.radioDot} /> : null}</View>
                <Ionicons name={m.icon} size={20} color={active ? theme.primary : theme.textSecondary} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>{t(m.title, m.titleDefault)}</Text>
                  <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{t(m.desc, m.descDefault)}</Text>
                </View>
              </Pressable>
            );
          })}
        </FadeInView>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <AppButton title={t("internalMarket.completePurchase", "Complete Purchase")} icon="lock-closed" loading={submitting} onPress={completePurchase} />
      </View>

      {/* Gateway overlays */}
      {paypalOpen ? (
        <PayPalWebView
          clientId={extra.paypalClientId}
          currency={extra.paypalCurrency || "USD"}
          amount={chargeAmount}
          opportunityId={`IM-${purchaseResult?.transaction?.transaction_id || listingId}`}
          shares={sharesNum}
          webOrigin={extra.webOrigin}
          onApproved={onPaypalApproved}
          onCancel={() => { setPaypalOpen(false); setStep("payment"); }}
          onError={(msg) => { setPaypalOpen(false); setError(msg); }}
        />
      ) : null}

      {nowUrl ? (
        <NowPaymentsWebView url={nowUrl} statusText={nowStatus} onClose={closeNow} onNavChange={onNowNav} />
      ) : null}
    </Screen>
  );
}

// Bank step is a distinct screen (rendered above via step==='bank'); split out for clarity.
function SuccessView({ summary, sharesNum, subtotal, projectName, sellerId, price, router, t, theme, type, spacing, isRTL, styles }) {
  const s = summary || {};
  const num = (v) => (v == null ? null : parseFloat(v));
  const rows = [
    { label: t("paymentSuccess.transactionId", "Transaction ID"), value: String(s.transaction_id ?? "—") },
    { label: t("internalMarket.investment", "Asset"), value: s.seller_info?.project || projectName },
    { label: t("internalMarket.sharesPurchased", "Shares Purchased"), value: String(s.shares_purchased ?? sharesNum) },
    { label: t("internalMarket.pricePerShare", "Price per Share"), value: `$${num(s.price_per_share) ?? price}` },
  ];
  if (num(s.subtotal) != null) rows.push({ label: t("internalMarket.subtotal", "Subtotal"), value: `$${num(s.subtotal).toFixed(2)}` });
  if (num(s.platform_fee) != null) rows.push({ label: t("internalMarket.platformFee", "Platform Fee") + (s.platform_fee_percentage != null ? ` (${num(s.platform_fee_percentage).toFixed(1)}%)` : ""), value: `$${num(s.platform_fee).toFixed(2)}` });
  const totalPaid = num(s.total_paid);
  if (s.payment_method) rows.push({ label: t("buyFlow.method", "Payment Method"), value: String(s.payment_method).replace(/_/g, " ") });
  if (s.payment_status) rows.push({ label: t("paymentSuccess.status", "Status"), value: String(s.payment_status) });
  if (num(s.wallet_balance_after) != null) rows.push({ label: t("internalMarket.walletBalanceAfter", "Remaining Wallet Balance"), value: `$${num(s.wallet_balance_after).toFixed(2)}` });
  if (s.seller_info?.seller_id || sellerId) rows.push({ label: t("internalMarket.seller", "Seller"), value: String(s.seller_info?.seller_id || sellerId) });
  if (s.completed_at) { try { rows.push({ label: t("internalMarket.completedAt", "Completed At"), value: new Date(s.completed_at).toLocaleString() }); } catch {} }

  return (
    <Screen edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40, gap: 22, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <FadeInView index={0} style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: theme.primary + "22" }]}>
            <Ionicons name="checkmark-circle" size={56} color={theme.positive} />
          </View>
          <Text style={[type.h1, { color: theme.text, textAlign: "center" }]}>{t("internalMarket.congratulations", "Congratulations!")}</Text>
          <Text style={[type.body, { color: theme.textSecondary, textAlign: "center" }]}>{t("internalMarket.purchaseSuccessMsg", "Your purchase has been completed and your shares are added to your holdings.")}</Text>
        </FadeInView>

        <FadeInView index={1}>
          <Card style={{ gap: 0 }}>
            <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left", marginBottom: 6 }]}>{t("internalMarket.transactionSummary", "Transaction Summary")}</Text>
            {rows.map((r, i) => (
              <View key={r.label} style={[styles.sumRow, i === 0 && { borderTopWidth: 0 }]}>
                <Text style={[type.caption, { color: theme.textSecondary }]}>{r.label}</Text>
                <Text style={[type.label, { color: theme.text, flexShrink: 1, textAlign: isRTL ? "left" : "right" }]} numberOfLines={2} selectable>{r.value}</Text>
              </View>
            ))}
            {totalPaid != null ? (
              <View style={styles.totalPaidRow}>
                <Text style={[type.label, { color: theme.textSecondary }]}>{t("internalMarket.totalPaid", "Total Paid")}</Text>
                <Text style={[type.statNumber, { color: theme.primaryDark }]}>{`$${totalPaid.toFixed(2)}`}</Text>
              </View>
            ) : null}
          </Card>
        </FadeInView>

        <View style={{ flex: 1 }} />
        <FadeInView index={2} style={{ gap: 10 }}>
          <AppButton title={t("paymentSuccess.viewInvestments", "View My Holdings")} icon="briefcase-outline" onPress={() => router.replace("/(tabs)/myfunds")} />
          <AppButton title={t("internalMarket.backToMarket", "Back to Market")} variant="secondary" onPress={() => router.replace("/(tabs)/market")} />
        </FadeInView>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    header: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 8 },
    headerBack: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },

    kvRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    totalCard: { alignItems: "center", gap: 6, paddingVertical: 22 },

    method: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: radii.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
    },
    methodActive: { borderColor: theme.primary, backgroundColor: theme.primary + "14" },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.borderStrong, alignItems: "center", justifyContent: "center" },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary },

    bankChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: isRTL ? "flex-end" : "flex-start" },
    detailBox: {
      borderRadius: radii.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
      padding: 12,
    },
    detailRow: { flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 6 },
    detailValue: { flexShrink: 1, textAlign: isRTL ? "left" : "right" },

    footer: {
      position: "absolute", left: 0, right: 0, bottom: 0,
      paddingHorizontal: 20, paddingTop: 10,
      backgroundColor: theme.surface,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border,
    },

    hero: { alignItems: "center", gap: 14, paddingTop: 24 },
    badge: { width: 92, height: 92, borderRadius: 46, alignItems: "center", justifyContent: "center" },
    sumRow: {
      flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between",
      gap: 12, paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border,
    },
    totalPaidRow: {
      flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between",
      gap: 12, paddingTop: 14, marginTop: 2, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.borderStrong,
    },
  });
