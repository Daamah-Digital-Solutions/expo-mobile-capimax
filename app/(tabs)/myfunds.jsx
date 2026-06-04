import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl, LayoutAnimation, Platform, UIManager } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../../src/components/Screen";
import Card from "../../src/components/Card";
import Badge from "../../src/components/Badge";
import Banner from "../../src/components/Banner";
import AppButton from "../../src/components/AppButton";
import Skeleton from "../../src/components/Skeleton";
import EmptyState from "../../src/components/EmptyState";
import AnimatedNumber from "../../src/components/motion/AnimatedNumber";
import FadeInView from "../../src/components/motion/FadeInView";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { myInvestmentsService, userService, internalMarketService } from "../../src/api/services";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const USD = (v) => `$${(parseFloat(v) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const HOLD_MS = 90 * 24 * 60 * 60 * 1000; // 90-day display constant (display only — backend is authoritative)
function fmtDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString(); } catch { return String(iso); }
}

const VS = {
  verified: { icon: "shield-checkmark", color: "positive", key: "documentsVerified" },
  pending: { icon: "time", color: "warning", key: "documentsUnderReview" },
  not_submitted: { icon: "alert-circle", color: "error", key: "documentsNotSubmitted" },
};

export default function MyFundsTab() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const [groups, setGroups] = useState([]);
  const [profile, setProfile] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({}); // opportunityId -> bool

  const fetchAll = useCallback(async () => {
    setError("");
    try {
      const [invRes, meRes, holdRes] = await Promise.all([
        myInvestmentsService.getMyInvestments(),
        userService.me(),
        internalMarketService.getHoldings(),
      ]);
      setGroups(Array.isArray(invRes?.data) ? invRes.data : []);
      setProfile(meRes?.data || null);
      setHoldings(holdRes?.data?.holdings || []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t("myfunds.loadError", "Failed to load your holdings"));
      throw err;
    }
  }, [t]);

  useEffect(() => {
    setLoading(true);
    fetchAll().catch(() => {}).finally(() => setLoading(false));
  }, [fetchAll]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll().catch(() => {}).finally(() => setRefreshing(false));
  };

  const total = useMemo(() => groups.reduce((acc, g) => acc + (parseFloat(g.total_amount_invested) || 0), 0), [groups]);

  // getSellStatus — backend can_sell_shares/days_until_can_sell are authoritative (90d display-only).
  const getSellStatus = useCallback((opportunityId) => {
    const holding = holdings.find((h) => h.investment_opportunity?.id === opportunityId);
    if (!holding) {
      return { canSell: false, tone: "error", title: t("myfunds.statusNoMarketTitle", "Not on Internal Market"), message: t("myfunds.statusNoMarketMsg", "This asset isn't tradable on the Internal Market yet.") };
    }
    if (!holding.can_sell_shares) {
      const eligible = holding.first_purchase_date ? new Date(new Date(holding.first_purchase_date).getTime() + HOLD_MS) : null;
      return {
        canSell: false, tone: "warning", title: t("myfunds.statusHoldingTitle", "3-Month Holding Period"),
        message: t("myfunds.statusHoldingMsg", "Eligible on {{date}} · {{days}} days remaining.", { date: eligible ? eligible.toLocaleDateString() : "—", days: holding.days_until_can_sell ?? "—" }),
        totalShares: holding.total_shares_owned,
      };
    }
    if ((holding.shares_available_for_sale ?? 0) <= 0) {
      return {
        canSell: false, tone: "info", title: t("myfunds.statusNoSharesTitle", "No Available Shares"),
        message: holding.shares_currently_listed > 0
          ? t("myfunds.statusNoSharesListed", "All {{total}} shares are currently listed for sale.", { total: holding.total_shares_owned })
          : t("myfunds.statusNoSharesLocked", "All shares are temporarily locked or reserved."),
        totalShares: holding.total_shares_owned, listedShares: holding.shares_currently_listed,
      };
    }
    return {
      canSell: true, tone: "success", title: t("myfunds.statusReadyTitle", "Ready to Sell"),
      message: t("myfunds.statusReadyMsg", "{{avail}} of {{total}} shares available for sale.", { avail: holding.shares_available_for_sale, total: holding.total_shares_owned }),
      totalShares: holding.total_shares_owned, availableShares: holding.shares_available_for_sale,
    };
  }, [holdings, t]);

  const onSell = (opportunityId, title) => {
    // Sell action → Internal Market with create-listing params (the listing UI is Phase 7).
    router.push({ pathname: "/(tabs)/market", params: { createListing: "true", opportunityId: String(opportunityId), opportunityTitle: title || "" } });
  };

  const toggle = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  };

  const header = (
    <View style={styles.titleRow}>
      <View style={{ gap: 2, flex: 1 }}>
        <Text style={[type.h1, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>{t("myfunds.myInvestments", "My Holdings")}</Text>
        <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{t("myfunds.trackYourInvestmentPortfolio", "Track your asset portfolio")}</Text>
      </View>
      <Ionicons name="briefcase-outline" size={24} color={theme.primary} />
    </View>
  );

  if (loading) {
    return (
      <Screen edges={["top"]}>
        <View style={{ padding: spacing.xl, gap: 14 }}>
          {header}
          <Skeleton width="100%" height={80} radius={radii.card} />
          <Skeleton width="100%" height={96} radius={radii.card} />
          <Skeleton width="100%" height={160} radius={radii.card} />
          <Skeleton width="100%" height={160} radius={radii.card} />
        </View>
      </Screen>
    );
  }

  if (error && !groups.length) {
    return (
      <Screen edges={["top"]}>
        <View style={{ padding: spacing.xl, gap: 16 }}>
          {header}
          <Banner type="error" message={error} actionLabel={t("common.retry", "Retry")} onAction={() => { setLoading(true); fetchAll().catch(() => {}).finally(() => setLoading(false)); }} />
        </View>
      </Screen>
    );
  }

  const ds = profile?.document_status;
  const vs = ds ? VS[ds.verification_status] || VS.not_submitted : null;

  return (
    <Screen edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}
      >
        {header}

        {/* Document verification status */}
        {vs ? (
          <FadeInView index={0}>
            <Card style={{ gap: 10 }}>
              <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>{t("myfunds.documentVerificationStatus", "Document Verification Status")}</Text>
              <View style={styles.statusRow}>
                <Ionicons name={vs.icon} size={18} color={theme[vs.color]} />
                <Text style={[type.body, { color: theme.text }]}>{t(`myfunds.${vs.key}`)}</Text>
              </View>
              <View style={styles.statusRow}>
                <Ionicons name={ds.has_passport ? "checkmark-circle" : "alert-circle"} size={16} color={ds.has_passport ? theme.positive : theme.error} />
                <Text style={[type.caption, { color: theme.textSecondary }]}>
                  {t("myfunds.passport", "Passport")}: {ds.has_passport ? t("myfunds.submitted", "Submitted") : t("myfunds.notSubmitted", "Not submitted")}
                </Text>
              </View>
            </Card>
          </FadeInView>
        ) : null}

        {/* Portfolio summary total */}
        <FadeInView index={1}>
          <Card style={{ gap: 4 }}>
            <Text style={[type.caption, styles.muLabel]}>{t("myfunds.totalInvestedAmount", "Total Purchased Amount")}</Text>
            <AnimatedNumber value={total} format={USD} style={[type.display, { color: theme.text }]} />
          </Card>
        </FadeInView>

        {error ? <Banner type="error" message={error} /> : null}

        {/* Holdings groups */}
        {groups.length ? (
          groups.map((g, idx) => {
            const o = g.opportunity || {};
            const sell = getSellStatus(o.id);
            const isOpen = !!expanded[o.id];
            return (
              <FadeInView key={o.id ?? idx} index={Math.min(idx + 2, 7)}>
                <Card style={{ gap: 14 }}>
                  <View style={styles.cardHead}>
                    <Text style={[type.h2, { color: theme.text, flex: 1, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>{o.title}</Text>
                    {o.status ? <Badge label={String(o.status)} tone="primary" /> : null}
                  </View>

                  {/* Stat grid */}
                  <View style={styles.statGrid}>
                    <StatBox label={t("myfunds.totalInvestment", "Total Purchase")} value={USD(g.total_amount_invested)} theme={theme} type={type} isRTL={isRTL} />
                    <StatBox label={t("myfunds.pricePerShare", "Price Per Share")} value={USD(o.price_per_share)} theme={theme} type={type} isRTL={isRTL} />
                    <StatBox label={t("myfunds.contractType", "Contract Type")} value={o.contract_type ? String(o.contract_type).toUpperCase() : "—"} theme={theme} type={type} isRTL={isRTL} />
                    <StatBox label={t("myfunds.duration", "Duration")} value={o.duration != null ? `${o.duration} ${t("myfunds.years", "years")}` : "—"} theme={theme} type={type} isRTL={isRTL} />
                  </View>

                  {/* Sell status */}
                  <Banner type={sell.tone} message={`${sell.title} — ${sell.message}`} />

                  {/* Investment history (collapsible) */}
                  <Pressable onPress={() => toggle(o.id)} style={styles.histHead} hitSlop={6}>
                    <Text style={[type.label, { color: theme.text }]}>{t("myfunds.investmentHistory", "Ownership History")}</Text>
                    <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={theme.textSecondary} />
                  </Pressable>
                  {isOpen ? (
                    <View style={styles.histList}>
                      {(g.investments || []).map((inv, i) => (
                        <View key={inv.id ?? i} style={[styles.histRow, i === 0 && { borderTopWidth: 0 }]}>
                          <Text style={[type.body, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>
                            {inv.shares_purchased} {t("common.shares", "shares")} · {USD(inv.amount_invested)}
                          </Text>
                          <Text style={[type.caption, { color: theme.textMuted }]}>{fmtDate(inv.created_at)}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* Sell action */}
                  <AppButton
                    title={t("myfunds.sell", "Sell")}
                    icon={sell.canSell ? "pricetag-outline" : "lock-closed-outline"}
                    variant={sell.canSell ? "primary" : "secondary"}
                    disabled={!sell.canSell}
                    onPress={() => onSell(o.id, o.title)}
                  />
                </Card>
              </FadeInView>
            );
          })
        ) : (
          <EmptyState
            icon="briefcase-outline"
            title={t("myfunds.noHoldings", "No holdings yet")}
            message={t("myfunds.noHoldingsMsg", "Buy shares in an asset to see your holdings here.")}
            actionLabel={t("opportunities.title", "Available Assets")}
            onAction={() => router.push("/(tabs)/funds")}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

function StatBox({ label, value, theme, type, isRTL }) {
  return (
    <View style={{ width: "47%", backgroundColor: theme.surfaceAlt, borderRadius: 12, padding: 12, gap: 3 }}>
      <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>{label}</Text>
      <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    titleRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    muLabel: { color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5, textAlign: isRTL ? "right" : "left" },
    statusRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 },
    cardHead: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
    statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
    histHead: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingTop: 2 },
    histList: { gap: 0 },
    histRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
  });
