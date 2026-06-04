// Phase 7 — Internal Market (secondary market), mirroring web pages/internal-market.
// Four sections (Listings · My Holdings · My Listings · Transactions) + market statistics.
// SELL = Create Listing sheet (Flow E); BUY = the /market/buy/[listingId] route (Flow F).
// All money fields can arrive as STRINGS from DRF → parseFloat before any math (STATE §7).
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../../src/components/Screen";
import Card from "../../src/components/Card";
import Badge from "../../src/components/Badge";
import Banner from "../../src/components/Banner";
import AppButton from "../../src/components/AppButton";
import Skeleton from "../../src/components/Skeleton";
import EmptyState from "../../src/components/EmptyState";
import SegmentedControl from "../../src/components/SegmentedControl";
import FadeInView from "../../src/components/motion/FadeInView";
import CreateListingSheet from "../../src/components/market/CreateListingSheet";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { internalMarketService } from "../../src/api/services";

const USD = (v) => `$${(parseFloat(v) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (v) => parseFloat(v) || 0;
function fmtDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString(); } catch { return String(iso); }
}

const EMPTY = { listings: [], holdings: [], myListings: [], transactions: [], statistics: {} };

export default function MarketTab() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const [data, setData] = useState(EMPTY);
  const [tab, setTab] = useState("listings"); // listings | holdings | mylistings | history
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [listingSheet, setListingSheet] = useState({ open: false, holding: null });
  const [handledParam, setHandledParam] = useState(false);

  const fetchAll = useCallback(async () => {
    setError("");
    try {
      const [listingsRes, holdingsRes, myListingsRes, txRes, statsRes] = await Promise.all([
        internalMarketService.getListings(),
        internalMarketService.getHoldings(),
        internalMarketService.getUserListings(),
        internalMarketService.getTransactions(),
        internalMarketService.getStatistics(),
      ]);
      return {
        listings: listingsRes?.data?.listings || [],
        holdings: holdingsRes?.data?.holdings || [],
        myListings: myListingsRes?.data?.listings || [],
        transactions: txRes?.data?.transactions || [],
        statistics: statsRes?.data?.statistics || {},
      };
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t("internalMarket.loadError", "Failed to load the market"));
      throw err;
    }
  }, [t]);

  const load = useCallback(() => {
    setLoading(true);
    fetchAll().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [fetchAll]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll().then(setData).catch(() => {}).finally(() => setRefreshing(false));
  };

  // Handle the createListing deep-link from MyFunds (Flow E): open the listing sheet for
  // the matching holding once holdings are loaded. Runs once per param arrival.
  useEffect(() => {
    if (handledParam || loading) return;
    if (params?.createListing === "true" && params?.opportunityId) {
      const oppId = parseInt(params.opportunityId, 10);
      const holding = data.holdings.find((h) => h.investment_opportunity?.id === oppId);
      setTab("holdings");
      if (holding && holding.can_sell_shares) {
        setListingSheet({ open: true, holding });
      }
      setHandledParam(true);
    }
  }, [params, data.holdings, loading, handledParam]);

  const openBuy = (listing) => {
    router.push({
      pathname: "/market/buy/[listingId]",
      params: {
        listingId: String(listing.listing_id),
        projectName: listing.project_name || "",
        pricePerShare: String(listing.asking_price_per_share ?? ""),
        sharesAvailable: String(listing.shares_to_sell ?? ""),
        sellerId: String(listing.seller_id ?? ""),
      },
    });
  };

  const TABS = [
    { value: "listings", label: t("internalMarket.tabListings", "Listings") },
    { value: "holdings", label: t("internalMarket.tabHoldings", "Holdings") },
    { value: "mylistings", label: t("internalMarket.tabMyListings", "My Listings") },
    { value: "history", label: t("internalMarket.tabHistory", "History") },
  ];

  const header = (
    <View style={styles.titleRow}>
      <View style={{ gap: 2, flex: 1 }}>
        <Text style={[type.h1, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>{t("internalMarket.title", "Internal Market")}</Text>
        <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{t("internalMarket.subtitle", "Secondary market for share trading")}</Text>
      </View>
      <Ionicons name="swap-horizontal-outline" size={24} color={theme.primary} />
    </View>
  );

  if (loading) {
    return (
      <Screen edges={["top"]}>
        <View style={{ padding: spacing.xl, gap: 14 }}>
          {header}
          <View style={styles.statsGrid}>
            <Skeleton width="48%" height={72} radius={radii.card} />
            <Skeleton width="48%" height={72} radius={radii.card} />
            <Skeleton width="48%" height={72} radius={radii.card} />
            <Skeleton width="48%" height={72} radius={radii.card} />
          </View>
          <Skeleton width="100%" height={44} radius={radii.pill} />
          <Skeleton width="100%" height={120} radius={radii.card} />
          <Skeleton width="100%" height={120} radius={radii.card} />
        </View>
      </Screen>
    );
  }

  if (error && data === EMPTY) {
    return (
      <Screen edges={["top"]}>
        <View style={{ padding: spacing.xl, gap: 16 }}>
          {header}
          <Banner type="error" message={error} actionLabel={t("common.retry", "Retry")} onAction={load} />
        </View>
      </Screen>
    );
  }

  const s = data.statistics || {};

  return (
    <Screen edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}
      >
        {header}

        {/* Market statistics */}
        <FadeInView index={0} style={styles.statsGrid}>
          <StatTile label={t("internalMarket.totalListings", "Total Listings")} value={String(s.total_listings ?? 0)} icon="list-outline" theme={theme} type={type} isRTL={isRTL} />
          <StatTile label={t("internalMarket.totalVolume", "Total Volume")} value={USD(s.total_volume)} icon="bar-chart-outline" theme={theme} type={type} isRTL={isRTL} />
          <StatTile label={t("internalMarket.avgPrice", "Avg Price")} value={USD(s.average_price)} icon="pricetag-outline" theme={theme} type={type} isRTL={isRTL} />
          <StatTile label={t("internalMarket.activeTraders", "Active Traders")} value={String(s.active_traders ?? 0)} icon="people-outline" theme={theme} type={type} isRTL={isRTL} />
        </FadeInView>

        {/* Section tabs */}
        <FadeInView index={1}>
          <SegmentedControl segments={TABS} value={tab} onChange={setTab} />
        </FadeInView>

        {error ? <Banner type="error" message={error} /> : null}

        {/* ── Market Listings ── */}
        {tab === "listings" ? (
          data.listings.length ? (
            data.listings.map((l, i) => (
              <FadeInView key={l.listing_id ?? i} index={Math.min(i + 2, 7)}>
                <Card style={{ gap: 12 }}>
                  <View style={styles.cardHead}>
                    <Text style={[type.h2, { color: theme.text, flex: 1, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>{l.project_name || t("internalMarket.unknownAsset", "Unknown Asset")}</Text>
                    <Badge label={`#${l.seller_id ?? "—"}`} tone="neutral" icon="person-outline" />
                  </View>
                  <View style={styles.kvGrid}>
                    <KV label={t("internalMarket.shares", "Shares")} value={String(l.shares_to_sell ?? "—")} theme={theme} type={type} isRTL={isRTL} />
                    <KV label={t("internalMarket.pricePerShare", "Price per Share")} value={USD(l.asking_price_per_share)} theme={theme} type={type} isRTL={isRTL} />
                    <KV label={t("internalMarket.totalPrice", "Total Price")} value={USD(num(l.shares_to_sell) * num(l.asking_price_per_share))} theme={theme} type={type} isRTL={isRTL} />
                  </View>
                  <AppButton title={t("internalMarket.buy", "Buy")} icon="cart-outline" onPress={() => openBuy(l)} />
                </Card>
              </FadeInView>
            ))
          ) : (
            <EmptyState icon="storefront-outline" title={t("internalMarket.noListingsAvailable", "No listings available")} message={t("internalMarket.noListingsMsg", "Check back later for shares listed by other owners.")} />
          )
        ) : null}

        {/* ── My Holdings (sellable) ── */}
        {tab === "holdings" ? (
          <>
            <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{t("internalMarket.holdingsDescription", "Manage your asset holdings")}</Text>
            {data.holdings.length ? (
              data.holdings.map((h, i) => (
                <FadeInView key={h.id ?? i} index={Math.min(i + 2, 7)}>
                  <Card style={{ gap: 12 }}>
                    <View style={styles.cardHead}>
                      <Text style={[type.h2, { color: theme.text, flex: 1, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>{h.investment_opportunity?.title || t("internalMarket.unknownAsset", "Unknown Asset")}</Text>
                      {h.can_sell_shares ? <Badge label={t("internalMarket.sellable", "Sellable")} tone="positive" icon="checkmark-circle" /> : null}
                    </View>
                    <View style={styles.kvGrid}>
                      <KV label={t("internalMarket.totalShares", "Total Shares")} value={String(h.total_shares_owned ?? "—")} theme={theme} type={type} isRTL={isRTL} />
                      <KV label={t("internalMarket.availableToSell", "Available to Sell")} value={String(h.shares_available_for_sale ?? "—")} theme={theme} type={type} isRTL={isRTL} />
                      <KV label={t("internalMarket.currentlyListed", "Currently Listed")} value={String(h.shares_currently_listed ?? "—")} theme={theme} type={type} isRTL={isRTL} />
                      <KV label={t("internalMarket.originalPrice", "Original Price")} value={USD(h.original_purchase_price_per_share)} theme={theme} type={type} isRTL={isRTL} />
                    </View>
                    {h.can_sell_shares ? (
                      <AppButton title={t("internalMarket.createListing", "Create Listing")} icon="pricetag-outline" variant="secondary" onPress={() => setListingSheet({ open: true, holding: h })} />
                    ) : (
                      <Banner
                        type="warning"
                        message={
                          (h.days_until_can_sell ?? 0) > 0
                            ? t("internalMarket.daysRemaining", "{{days}} days remaining until you can sell these shares", { days: h.days_until_can_sell })
                            : t("internalMarket.notEligibleYet", "Shares not eligible for trading yet")
                        }
                      />
                    )}
                  </Card>
                </FadeInView>
              ))
            ) : (
              <EmptyState icon="wallet-outline" title={t("internalMarket.noHoldingsYet", "No holdings yet")} message={t("internalMarket.noHoldingsDescription", "You don't have any holdings available for trading")} />
            )}
          </>
        ) : null}

        {/* ── My Listings ── */}
        {tab === "mylistings" ? (
          data.myListings.length ? (
            data.myListings.map((l, i) => (
              <FadeInView key={l.listing_id ?? i} index={Math.min(i + 2, 7)}>
                <Card style={{ gap: 12 }}>
                  <View style={styles.cardHead}>
                    <Text style={[type.h2, { color: theme.text, flex: 1, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>{l.project_name || t("internalMarket.unknownAsset", "Unknown Asset")}</Text>
                    <Badge label={String(l.status || "—")} tone={l.status === "active" ? "positive" : "neutral"} />
                  </View>
                  <View style={styles.kvGrid}>
                    <KV label={t("internalMarket.shares", "Shares")} value={String(l.shares_to_sell ?? "—")} theme={theme} type={type} isRTL={isRTL} />
                    <KV label={t("internalMarket.pricePerShare", "Price per Share")} value={USD(l.asking_price_per_share)} theme={theme} type={type} isRTL={isRTL} />
                    <KV label={t("internalMarket.totalValue", "Total Value")} value={USD(num(l.shares_to_sell) * num(l.asking_price_per_share))} theme={theme} type={type} isRTL={isRTL} />
                    <KV label={t("internalMarket.created", "Created")} value={fmtDate(l.created_at)} theme={theme} type={type} isRTL={isRTL} />
                  </View>
                </Card>
              </FadeInView>
            ))
          ) : (
            <EmptyState icon="pricetags-outline" title={t("internalMarket.noActiveListings", "No active listings")} message={t("internalMarket.noActiveListingsMsg", "List shares from your holdings to start selling.")} />
          )
        ) : null}

        {/* ── Transaction History ── */}
        {tab === "history" ? (
          data.transactions.length ? (
            <Card style={{ gap: 0 }}>
              {data.transactions.map((tx, i) => {
                const isBuy = tx.transaction_type === "purchase";
                return (
                  <View key={tx.transaction_id ?? i} style={[styles.txRow, i === 0 && { borderTopWidth: 0 }]}>
                    <View style={[styles.txIcon, { backgroundColor: (isBuy ? theme.info : theme.positive) + "22" }]}>
                      <Ionicons name={isBuy ? "arrow-down" : "arrow-up"} size={16} color={isBuy ? theme.info : theme.positive} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[type.body, { color: theme.text, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>
                        {(isBuy ? t("internalMarket.purchased", "Purchased") : t("internalMarket.sold", "Sold"))} {tx.shares} {t("internalMarket.shares", "Shares")}
                      </Text>
                      <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>
                        {(tx.project_name || t("internalMarket.unknownAsset", "Unknown Asset"))} · {fmtDate(tx.completed_at)}
                      </Text>
                    </View>
                    <Text style={[type.label, { color: theme.text }]}>{USD(tx.total_amount)}</Text>
                  </View>
                );
              })}
            </Card>
          ) : (
            <EmptyState icon="time-outline" title={t("internalMarket.noTransactionsYet", "No transactions yet")} message={t("internalMarket.noTransactionsMsg", "Your market purchases and sales will appear here.")} />
          )
        ) : null}
      </ScrollView>

      {/* Create Listing (SELL — Flow E) */}
      <CreateListingSheet
        visible={listingSheet.open}
        holding={listingSheet.holding}
        onClose={() => setListingSheet({ open: false, holding: null })}
        onSuccess={() => { setListingSheet({ open: false, holding: null }); load(); }}
      />
    </Screen>
  );
}

function StatTile({ label, value, icon, theme, type, isRTL }) {
  return (
    <View style={{ width: "48%", backgroundColor: theme.surfaceAlt, borderRadius: 14, padding: 12, gap: 4 }}>
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
        <Ionicons name={icon} size={14} color={theme.primary} />
        <Text style={[type.caption, { color: theme.textMuted, flex: 1, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={[type.statNumber, { color: theme.text, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function KV({ label, value, theme, type, isRTL }) {
  return (
    <View style={{ width: "47%", gap: 2 }}>
      <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>{label}</Text>
      <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    titleRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
    cardHead: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
    kvGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
    txRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    txIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  });
