import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../../src/components/Screen";
import Card from "../../src/components/Card";
import AppButton from "../../src/components/AppButton";
import Banner from "../../src/components/Banner";
import Skeleton from "../../src/components/Skeleton";
import EmptyState from "../../src/components/EmptyState";
import SectionHeader from "../../src/components/SectionHeader";
import FadeInView from "../../src/components/motion/FadeInView";
import AnimatedNumber from "../../src/components/motion/AnimatedNumber";
import PaymentStep from "../../src/components/invest/PaymentStep";
import ContractStep from "../../src/components/invest/ContractStep";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { useAuth } from "../../src/context/AuthContext";
import { opportunityService, userService, feeService, calculateFee, DEFAULT_FEE_PERCENTAGE } from "../../src/api/services";

const USD = (n) => `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// price_per_share / total_investment arrive as STRINGS from the API → parseFloat before any math.
function money(v, opts) {
  const n = parseFloat(v);
  if (Number.isNaN(n)) return String(v ?? "—");
  return n.toLocaleString("en-US", opts);
}

// The Buy flow is a 4-step machine on this single route (mirrors web InvestForm):
//   0 Gate (auth + passport + terms)  ·  1 Amount/fee  ·  2 Payment  ·  3 Contract  ·  4 Complete
// Phase 4 builds one step per turn. Step 0 (Gate) is complete; later steps are stubbed below.
const STEPS = ["review", "amount", "payment", "contract"];

export default function InvestScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const { isAuthenticated, setPendingRoute } = useAuth();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const [step, setStep] = useState(0);
  const [opp, setOpp] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [shares, setShares] = useState(""); // controlled string; parsed for math
  const [feePercentage, setFeePercentage] = useState(DEFAULT_FEE_PERCENTAGE);
  const [payment, setPayment] = useState(null); // { transaction_id, paymentMethod, status } from Step 2
  const [contract, setContract] = useState(null); // { contractId, signedAt, ... } from Step 3

  const load = useCallback(async () => {
    setError("");
    try {
      // Asset (for shares/price math in later steps) + profile (for the passport gate).
      const [oppRes, meRes] = await Promise.all([
        opportunityService.getOpportunity(id),
        userService.me(),
      ]);
      setOpp(oppRes?.data || null);
      setProfile(meRes?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t("common.error", "Error"));
      throw err;
    }
  }, [id, t]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [load]);

  // Defensive: the detail page already auth-gates before routing here, but if the session
  // lapsed mid-flow, bounce back to login and return to this exact route afterward (Flow A).
  useEffect(() => {
    if (!isAuthenticated) {
      setPendingRoute(`/invest/${id}`);
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, id]);

  // Fee percentage for Step 1 (Flow D step 1.4). Default 2.5 if the call fails — never blocks.
  useEffect(() => {
    let active = true;
    feeService
      .getFeePercentage()
      .then((res) => {
        const p = parseFloat(res?.data?.fee_percentage);
        if (active && !Number.isNaN(p)) setFeePercentage(p);
      })
      .catch(() => {}); // keep DEFAULT_FEE_PERCENTAGE
    return () => {
      active = false;
    };
  }, []);

  // Seed the shares input with the asset's minimum once the asset loads.
  useEffect(() => {
    if (opp && shares === "") {
      setShares(String(Math.max(1, parseInt(opp.minimum_shares, 10) || 1)));
    }
  }, [opp]); // eslint-disable-line react-hooks/exhaustive-deps

  const reload = () => {
    setLoading(true);
    load().catch(() => {}).finally(() => setLoading(false));
  };

  const hasPassport = profile?.document_status?.has_passport === true;
  const verificationStatus = profile?.document_status?.verification_status; // verified | pending | not_submitted
  const canContinue = hasPassport && termsAccepted;

  const goEditProfile = () => router.push("/edit-profile");

  const BackButton = (
    <Pressable style={styles.headerBack} onPress={() => (step > 0 ? setStep(step - 1) : router.back())} hitSlop={8}>
      <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color={theme.text} />
    </Pressable>
  );

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      {BackButton}
      <View style={styles.headerCenter}>
        <Text style={[type.label, { color: theme.text }]}>{t("common.invest", "Buy")}</Text>
        <Text style={[type.caption, { color: theme.textMuted }]}>
          {t("buyFlow.stepOf", "Step {{current}} of {{total}}", { current: step + 1, total: STEPS.length })}
        </Text>
      </View>
      <View style={styles.headerBack} />
    </View>
  );

  const StepRail = (
    <View style={styles.rail}>
      {STEPS.map((key, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <View key={key} style={styles.railItem}>
            <View
              style={[
                styles.railDot,
                (done || active) && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
            >
              {done ? (
                <Ionicons name="checkmark" size={12} color={theme.onPrimary} />
              ) : (
                <Text style={[type.micro, { color: active ? theme.onPrimary : theme.textMuted }]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[type.micro, { color: active ? theme.text : theme.textMuted }]} numberOfLines={1}>
              {t(`buyFlow.${key}`, key)}
            </Text>
          </View>
        );
      })}
    </View>
  );

  if (loading) {
    return (
      <Screen edges={["bottom"]}>
        {Header}
        <View style={{ padding: spacing.xl, gap: 14 }}>
          <Skeleton width="100%" height={56} radius={radii.card} />
          <Skeleton width="100%" height={110} radius={radii.card} />
          <Skeleton width="100%" height={140} radius={radii.card} />
          <Skeleton width="60%" height={20} radius={6} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen edges={["bottom"]}>
        {Header}
        <View style={styles.centerState}>
          <Banner type="error" message={error} actionLabel={t("common.retry", "Retry")} onAction={reload} />
          <AppButton title={t("opportunity.backToOpportunities", "Back to Assets")} variant="secondary" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (!opp) {
    return (
      <Screen edges={["bottom"]}>
        {Header}
        <EmptyState
          icon="search-outline"
          title={t("opportunity.notFound", "Asset not found")}
          actionLabel={t("opportunity.backToOpportunities", "Back to Assets")}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const o = opp;

  // Shared money math (Steps 1 + 2). price_per_share is a STRING → parseFloat.
  const price = parseFloat(o.price_per_share) || 0;
  const minShares = Math.max(1, parseInt(o.minimum_shares, 10) || 1);
  // Available = total_shares - purchased_shares when both present, else available_shares.
  const totalSharesN = parseInt(o.total_shares, 10);
  const purchasedSharesN = parseInt(o.purchased_shares, 10);
  const fromTotals = Number.isFinite(totalSharesN) && Number.isFinite(purchasedSharesN) ? totalSharesN - purchasedSharesN : NaN;
  const maxShares = Number.isFinite(fromTotals) ? Math.max(0, fromTotals) : parseInt(o.available_shares, 10) || 0;
  const sharesNum = parseInt(shares, 10) || 0;
  const breakdown = calculateFee(sharesNum * price, feePercentage); // { base_amount, fee_amount, total_amount }
  const totalAmount = Math.round((breakdown.total_amount || 0) * 100) / 100; // carried value == displayed value

  const onGatewaySuccess = (result) => { setPayment(result); setStep(3); };
  const onManualSuccess = (result) => { setPayment(result); setStep(4); };
  const onSigned = (info) => { setContract(info); setStep(4); };

  // ── Step 0 — Gate ──────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <Screen edges={["bottom"]}>
        {Header}
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 + insets.bottom, gap: 20 }} showsVerticalScrollIndicator={false}>
          {StepRail}

          {/* Asset summary */}
          <FadeInView index={0}>
            <Card style={{ gap: 12 }}>
              <Text style={[type.h2, { color: theme.text, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>
                {o.title}
              </Text>
              <View style={styles.summaryRow}>
                <SummaryCell label={t("opportunity.pricePerShare", "Price / share")} value={`$${money(o.price_per_share, { maximumFractionDigits: 0 })}`} theme={theme} type={type} isRTL={isRTL} />
                <SummaryCell label={t("opportunity.availableShares", "Available Shares")} value={money(o.available_shares)} theme={theme} type={type} isRTL={isRTL} />
                <SummaryCell label={t("opportunity.minShares", "Minimum Shares")} value={money(o.minimum_shares)} theme={theme} type={type} isRTL={isRTL} />
              </View>
            </Card>
          </FadeInView>

          {/* Review intro */}
          <FadeInView index={1} style={{ gap: 8 }}>
            <SectionHeader title={t("buyFlow.reviewTitle", "Review & verify")} />
            <Text style={[type.body, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
              {t("buyFlow.reviewSubtitle", "Confirm your details before buying shares in this asset.")}
            </Text>
          </FadeInView>

          {/* Identity verification gate */}
          <FadeInView index={2}>
            <Card style={{ gap: 12 }}>
              <View style={styles.verHeader}>
                <Ionicons name="shield-checkmark-outline" size={18} color={theme.primary} />
                <Text style={[type.label, { color: theme.text }]}>{t("buyFlow.verificationTitle", "Identity verification")}</Text>
              </View>

              {hasPassport ? (
                <View style={styles.statusRow}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.positive} />
                  <Text style={[type.body, { color: theme.text, flex: 1, textAlign: isRTL ? "right" : "left" }]}>
                    {t("buyFlow.verifiedReady", "You're verified and ready to buy.")}
                  </Text>
                </View>
              ) : (
                <>
                  <Banner
                    type={verificationStatus === "pending" ? "warning" : "info"}
                    message={
                      verificationStatus === "pending"
                        ? t("buyFlow.verificationPending", "Your documents are under review. You can continue once your passport is verified.")
                        : t("buyFlow.passportRequired", "A verified passport is required before you can buy.")
                    }
                  />
                  <AppButton
                    title={t("investForm.completeProfileToInvest", "Complete Profile to Buy")}
                    icon="id-card-outline"
                    variant="secondary"
                    onPress={goEditProfile}
                  />
                </>
              )}
            </Card>
          </FadeInView>

          {/* Terms */}
          <FadeInView index={3}>
            <Pressable onPress={() => setTermsAccepted((v) => !v)} style={styles.termsRow} hitSlop={6}>
              <View style={[styles.checkbox, termsAccepted && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                {termsAccepted ? <Ionicons name="checkmark" size={15} color={theme.onPrimary} /> : null}
              </View>
              <Text style={[type.body, { color: theme.textSecondary, flex: 1, textAlign: isRTL ? "right" : "left" }]}>
                {t("buyFlow.agreePrefix", "I agree to the")}{" "}
                <Text style={{ color: theme.primaryDark, fontWeight: "600" }}>{t("buyFlow.termsLink", "Terms & Conditions")}</Text>
              </Text>
            </Pressable>
          </FadeInView>
        </ScrollView>

        {/* Sticky continue bar */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
          {!canContinue ? (
            <Text style={[type.caption, { color: theme.textMuted, textAlign: "center" }]}>
              {!hasPassport ? t("buyFlow.completeProfileHint", "Complete your profile to continue.") : t("buyFlow.acceptTermsHint", "Accept the terms to continue.")}
            </Text>
          ) : null}
          <AppButton title={t("common.continue", "Continue")} icon="arrow-forward" disabled={!canContinue} onPress={() => setStep(1)} />
        </View>
      </Screen>
    );
  }

  // ── Step 1 — Amount & fee ──────────────────────────────────────────────────
  if (step === 1) {
    const valid = sharesNum >= minShares && maxShares > 0 && sharesNum <= maxShares;
    const tooFew = sharesNum < minShares;
    const tooMany = maxShares > 0 && sharesNum > maxShares;

    const clampSet = (n) => {
      let v = Math.max(0, Math.round(Number(n) || 0));
      if (maxShares > 0) v = Math.min(v, maxShares);
      setShares(String(v));
    };
    const onInput = (txt) => {
      const digits = txt.replace(/[^0-9]/g, "");
      if (maxShares > 0 && parseInt(digits, 10) > maxShares) return clampSet(maxShares);
      setShares(digits);
    };

    return (
      <Screen edges={["bottom"]}>
        {Header}
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 130 + insets.bottom, gap: 20 }} showsVerticalScrollIndicator={false}>
          {StepRail}

          {/* Asset + unit price */}
          <FadeInView index={0}>
            <Card style={{ gap: 6 }}>
              <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>{o.title}</Text>
              <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>
                {t("opportunity.pricePerShare", "Price / share")}: {USD(price)}
              </Text>
            </Card>
          </FadeInView>

          {/* Shares stepper */}
          <FadeInView index={1} style={{ gap: 10 }}>
            <SectionHeader title={t("buyFlow.amountTitle", "How many shares?")} />
            <Card style={{ gap: 12 }}>
              <View style={styles.stepperRow}>
                <Pressable
                  style={[styles.stepperBtn, sharesNum <= 0 && styles.stepperBtnOff]}
                  onPress={() => clampSet(sharesNum - 1)}
                  hitSlop={6}
                >
                  <Ionicons name="remove" size={22} color={theme.text} />
                </Pressable>
                <TextInput
                  style={[styles.stepperInput, type.statNumber, { color: theme.text }]}
                  value={shares}
                  onChangeText={onInput}
                  onBlur={() => shares === "" && setShares("0")}
                  keyboardType="number-pad"
                  maxLength={9}
                  selectTextOnFocus
                  textAlign="center"
                />
                <Pressable
                  style={[styles.stepperBtn, maxShares > 0 && sharesNum >= maxShares && styles.stepperBtnOff]}
                  onPress={() => clampSet(sharesNum + 1)}
                  hitSlop={6}
                >
                  <Ionicons name="add" size={22} color={theme.text} />
                </Pressable>
              </View>
              <View style={styles.rangeRow}>
                <Text style={[type.caption, { color: theme.textMuted }]}>{t("buyFlow.minSharesNote", "Minimum {{count}} shares", { count: minShares })}</Text>
                <Text style={[type.caption, { color: theme.textMuted }]}>
                  {maxShares > 0 ? t("buyFlow.sharesAvailable", "{{count}} available", { count: maxShares }) : t("buyFlow.soldOut", "No shares available")}
                </Text>
              </View>
              {tooFew ? <Banner type="warning" message={t("buyFlow.minSharesNote", "Minimum {{count}} shares", { count: minShares })} /> : null}
              {tooMany ? <Banner type="warning" message={t("buyFlow.maxReached", "Only {{count}} shares available", { count: maxShares })} /> : null}
            </Card>
          </FadeInView>

          {/* Live breakdown */}
          <FadeInView index={2} style={{ gap: 10 }}>
            <SectionHeader title={t("investForm.investmentSummary", "Purchase Summary")} />
            <Card style={{ gap: 0 }}>
              <BreakdownRow
                label={`${t("investForm.numberOfShares", "Number of Shares")} × ${USD(price)}`}
                value={USD(breakdown.base_amount)}
                styles={styles} theme={theme} type={type} isRTL={isRTL} first
              />
              <BreakdownRow
                label={t("buyFlow.platformFee", "Platform fee ({{pct}}%)", { pct: feePercentage })}
                value={USD(breakdown.fee_amount)}
                styles={styles} theme={theme} type={type} isRTL={isRTL}
              />
              <View style={styles.totalRow}>
                <Text style={[type.label, { color: theme.textSecondary }]}>{t("buyFlow.totalToPay", "Total to pay")}</Text>
                <AnimatedNumber
                  value={breakdown.total_amount}
                  format={USD}
                  style={[type.display, { color: theme.text, textAlign: isRTL ? "left" : "right" }]}
                />
              </View>
            </Card>
          </FadeInView>
        </ScrollView>

        {/* Sticky continue bar */}
        <View style={[styles.footerBar, { paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.footerSummary}>
            <Text style={[type.caption, { color: theme.textMuted }]}>{t("buyFlow.totalToPay", "Total to pay")}</Text>
            <Text style={[type.statNumber, { color: theme.text }]}>{USD(breakdown.total_amount)}</Text>
          </View>
          <AppButton title={t("common.continue", "Continue")} icon="arrow-forward" fullWidth={false} style={{ minWidth: 150 }} disabled={!valid} onPress={() => setStep(2)} />
        </View>
      </Screen>
    );
  }

  // ── Step 2 — Payment (all 5 methods) ───────────────────────────────────────
  if (step === 2) {
    return (
      <Screen edges={["bottom"]}>
        {Header}
        <PaymentStep
          rail={StepRail}
          opportunityId={id}
          shares={sharesNum}
          total={totalAmount}
          base={breakdown.base_amount}
          fee={breakdown.fee_amount}
          feePercentage={feePercentage}
          onGatewaySuccess={onGatewaySuccess}
          onManualSuccess={onManualSuccess}
        />
      </Screen>
    );
  }

  // ── Step 3 — Contract (gateway payments only) ──────────────────────────────
  if (step === 3) {
    return (
      <Screen edges={["bottom"]}>
        {Header}
        <ContractStep
          rail={StepRail}
          opportunityId={id}
          payment={payment}
          total={totalAmount}
          onSigned={onSigned}
        />
      </Screen>
    );
  }

  // ── Step 4 — Complete — built in the next turn ─────────────────────────────
  return (
    <Screen edges={["bottom"]}>
      {Header}
      <View style={styles.centerState}>
        <Ionicons name="construct-outline" size={44} color={theme.primary} />
        <Text style={[type.h2, { color: theme.text, textAlign: "center" }]}>{t(`buyFlow.${STEPS[step]}`, STEPS[step] || "complete")}</Text>
        <Text style={[type.body, { color: theme.textSecondary, textAlign: "center" }]}>
          {payment ? `${payment.paymentMethod} · ${payment.status} · #${payment.transaction_id}` : `Phase 4 — step ${step + 1} coming next.`}
        </Text>
        <AppButton title={t("opportunity.backToOpportunities", "Back")} variant="secondary" onPress={() => setStep(Math.max(0, step - 1))} />
      </View>
    </Screen>
  );
}

function BreakdownRow({ label, value, styles, theme, type, isRTL, first }) {
  return (
    <View style={[styles.breakdownRow, first && { borderTopWidth: 0 }]}>
      <Text style={[type.body, { color: theme.textSecondary, flexShrink: 1, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>{label}</Text>
      <Text style={[type.label, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

function SummaryCell({ label, value, theme, type, isRTL }) {
  return (
    <View style={{ flex: 1, gap: 3, alignItems: isRTL ? "flex-end" : "flex-start" }}>
      <Text style={[type.caption, { color: theme.textMuted }]} numberOfLines={1}>{label}</Text>
      <Text style={[type.statNumber, { color: theme.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    header: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    headerBack: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
    headerCenter: { alignItems: "center", gap: 1 },

    rail: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "flex-start", justifyContent: "space-between" },
    railItem: { flex: 1, alignItems: "center", gap: 5 },
    railDot: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
    },

    summaryRow: { flexDirection: isRTL ? "row-reverse" : "row", gap: 12 },

    verHeader: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 },
    statusRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 },

    termsRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor: theme.borderStrong,
      alignItems: "center",
      justifyContent: "center",
    },

    centerState: { flex: 1, justifyContent: "center", padding: 20, gap: 16 },

    stepperRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    stepperBtn: {
      width: 52,
      height: 52,
      borderRadius: radii.button,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    stepperBtnOff: { opacity: 0.4 },
    stepperInput: { flex: 1, height: 52, paddingVertical: 0 },
    rangeRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" },

    breakdownRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    totalRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingTop: 14,
      marginTop: 2,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.borderStrong,
    },

    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 20,
      paddingTop: 10,
      gap: 8,
      backgroundColor: theme.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    footerBar: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 14,
      paddingHorizontal: 20,
      paddingTop: 10,
      backgroundColor: theme.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    footerSummary: { gap: 1 },
  });
