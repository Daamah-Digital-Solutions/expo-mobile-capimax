// Home (Phase: Home + tab restructure) — the default tab after login.
// 4 sections: header (greeting + wallet/notifications) · portfolio value card (wallet total +
// portfolio sparkline + growth chip) · static value-prop grid · featured assets slider ·
// secondary-market list. COPY RULE: never the words "Trade"/"Invest" — icons + scroll only.
// Per-section skeleton/empty/error; both modes + RTL; zero mock.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, FlatList, StyleSheet, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../../src/components/Screen";
import Logo from "../../src/components/Logo";
import Card from "../../src/components/Card";
import Banner from "../../src/components/Banner";
import Skeleton from "../../src/components/Skeleton";
import Sparkline from "../../src/components/Sparkline";
import AnimatedNumber from "../../src/components/motion/AnimatedNumber";
import FadeInView from "../../src/components/motion/FadeInView";
import FeaturedAssetCard from "../../src/components/home/FeaturedAssetCard";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { userService, walletService, portfolioService, opportunityService, internalMarketService } from "../../src/api/services";

const USD = (v) => `$${(parseFloat(v) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (v) => parseFloat(v) || 0;
const PCT = (v) => { const n = parseFloat(v) || 0; return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`; };

// Static value props (same concepts as onboarding) — no live numbers, icons only.
const VALUE_PROPS = [
  { icon: "shield-checkmark-outline", key: "spv" },
  { icon: "pie-chart-outline", key: "diversified" },
  { icon: "ribbon-outline", key: "rating" },
  { icon: "umbrella-outline", key: "insured" },
  { icon: "sparkles-outline", key: "bonus" },
  { icon: "cash-outline", key: "financing" },
];

export default function HomeTab() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [listings, setListings] = useState([]);
  const [errs, setErrs] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [me, sum, port, opps, list] = await Promise.allSettled([
      userService.me(),
      walletService.getSummary(),
      portfolioService.getMyPortfolio(24),
      opportunityService.getOpportunities(),
      internalMarketService.getListings(),
    ]);
    setProfile(me.status === "fulfilled" ? me.value?.data : null);
    setSummary(sum.status === "fulfilled" ? sum.value?.data : null);
    setPortfolio(port.status === "fulfilled" && port.value?.data?.success ? port.value.data.portfolio_data : null);
    setFeatured(opps.status === "fulfilled" ? (opps.value?.data?.results || []).slice(0, 6) : []);
    setListings(list.status === "fulfilled" ? (list.value?.data?.listings || []).slice(0, 5) : []);
    setErrs({
      summary: sum.status === "rejected",
      featured: opps.status === "rejected",
      listings: list.status === "rejected",
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    load().catch(() => {}).finally(() => setLoading(false));
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load().catch(() => {}).finally(() => setRefreshing(false));
  };

  const username = profile?.user_details?.username || profile?.username || "";
  const sparkValues = portfolio?.chart_data?.total_value || [];
  const hasSpark = Array.isArray(sparkValues) && sparkValues.length > 1;
  const growth = portfolio?.current_stats?.growth_percentage;
  const growthUp = num(growth) >= 0;

  const openListing = (l) =>
    router.push({
      pathname: "/market/buy/[listingId]",
      params: {
        listingId: String(l.listing_id),
        projectName: l.project_name || "",
        pricePerShare: String(l.asking_price_per_share ?? ""),
        sharesAvailable: String(l.shares_to_sell ?? ""),
        sellerId: String(l.seller_id ?? ""),
      },
    });

  // ── Header (greeting + wallet/notifications) ─────────────────────────────────
  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <View style={{ flex: 1, gap: 4, alignItems: isRTL ? "flex-end" : "flex-start" }}>
        <Logo height={14} />
        <Text style={[type.h2, { color: theme.text, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>{username || t("account.user", "User")}</Text>
      </View>
      <View style={styles.headerIcons}>
        <Pressable style={styles.iconBtn} onPress={() => router.push("/wallet")} hitSlop={6}>
          <Ionicons name="wallet-outline" size={22} color={theme.text} />
        </Pressable>
        <Pressable style={styles.iconBtn} hitSlop={6}>
          <Ionicons name="notifications-outline" size={22} color={theme.text} />
          <View style={styles.notifDot} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <Screen edges={["top"]}>
      {Header}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32, gap: 18 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}
      >
        {/* ── 2) Portfolio value card ── */}
        <View style={{ paddingHorizontal: spacing.xl }}>
          <FadeInView index={0}>
            {loading ? (
              <Skeleton width="100%" height={150} radius={radii.card} />
            ) : (
              <Card pressable onPress={() => router.push("/(tabs)/portfolio")} style={{ gap: 10 }}>
                <View style={styles.pvTop}>
                  <View style={{ gap: 3 }}>
                    <Text style={[type.caption, styles.muLabel]}>{t("home.portfolioValue", "Portfolio Value")}</Text>
                    <AnimatedNumber value={num(summary?.total_balance)} format={USD} style={[type.display, { color: theme.text }]} />
                  </View>
                  {growth != null ? (
                    <View style={[styles.growthChip, { backgroundColor: (growthUp ? theme.positive : theme.negative) + "22" }]}>
                      <Ionicons name={growthUp ? "trending-up" : "trending-down"} size={14} color={growthUp ? theme.positive : theme.negative} />
                      <Text style={[type.caption, { color: growthUp ? theme.positive : theme.negative, fontWeight: "700" }]}>{PCT(growth)}</Text>
                    </View>
                  ) : null}
                </View>
                {hasSpark ? (
                  <Sparkline values={sparkValues} color={growthUp ? theme.positive : theme.negative} height={52} />
                ) : (
                  <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>
                    {t("home.portfolioEmpty", "Your portfolio is just getting started — your growth will appear here.")}
                  </Text>
                )}
              </Card>
            )}
          </FadeInView>
        </View>

        {/* ── 3) Value-prop grid (static) ── */}
        <View style={{ paddingHorizontal: spacing.xl, gap: 10 }}>
          <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>{t("home.whyTitle", "Why CapiMax")}</Text>
          <View style={styles.grid}>
            {VALUE_PROPS.map((vp, i) => (
              <FadeInView key={vp.key} index={Math.min(i, 5)} style={styles.gridCellWrap}>
                <View style={styles.gridCell}>
                  <View style={styles.vpIcon}><Ionicons name={vp.icon} size={22} color={theme.primary} /></View>
                  <Text style={[type.caption, { color: theme.text, textAlign: isRTL ? "right" : "left", fontWeight: "600" }]} numberOfLines={2}>
                    {t(`home.vp_${vp.key}`)}
                  </Text>
                </View>
              </FadeInView>
            ))}
          </View>
        </View>

        {/* ── 4) Featured assets slider ── */}
        <View style={{ gap: 10 }}>
          <SectionHead title={t("home.featured", "Featured assets")} onSeeAll={() => router.push("/(tabs)/funds")} t={t} theme={theme} type={type} isRTL={isRTL} styles={styles} />
          {loading ? (
            <View style={[styles.sliderRow, { paddingHorizontal: spacing.xl }]}>
              <Skeleton width={240} height={210} radius={radii.card} />
              <Skeleton width={240} height={210} radius={radii.card} />
            </View>
          ) : errs.featured ? (
            <View style={{ paddingHorizontal: spacing.xl }}><Banner type="error" message={t("home.featuredError", "Couldn't load featured assets.")} /></View>
          ) : featured.length ? (
            <FlatList
              data={featured}
              keyExtractor={(o) => String(o.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 12 }}
              renderItem={({ item }) => <FeaturedAssetCard opportunity={item} width={240} onPress={() => router.push(`/opportunity/${item.id}`)} />}
            />
          ) : (
            <View style={{ paddingHorizontal: spacing.xl }}>
              <Card style={styles.emptyMini}><Text style={[type.caption, { color: theme.textMuted, textAlign: "center" }]}>{t("home.featuredEmpty", "No featured assets right now.")}</Text></Card>
            </View>
          )}
        </View>

        {/* ── 5) Secondary market ── */}
        <View style={{ paddingHorizontal: spacing.xl, gap: 10 }}>
          <SectionHead title={t("home.secondaryMarket", "Secondary market")} onSeeAll={() => router.push("/(tabs)/market")} t={t} theme={theme} type={type} isRTL={isRTL} styles={styles} inset />
          {loading ? (
            <>
              <Skeleton width="100%" height={64} radius={radii.card} />
              <Skeleton width="100%" height={64} radius={radii.card} />
            </>
          ) : errs.listings ? (
            <Banner type="error" message={t("home.marketError", "Couldn't load the market.")} />
          ) : listings.length ? (
            listings.map((l, i) => (
              <FadeInView key={l.listing_id ?? i} index={Math.min(i, 5)}>
                <Card pressable onPress={() => openListing(l)} style={styles.listRow}>
                  <View style={styles.listIcon}><Ionicons name="swap-horizontal-outline" size={18} color={theme.primary} /></View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>{l.project_name || t("internalMarket.unknownAsset", "Unknown Asset")}</Text>
                    <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>
                      {l.shares_to_sell} {t("internalMarket.shares", "Shares")} · {USD(l.asking_price_per_share)}
                    </Text>
                  </View>
                  <View style={{ alignItems: isRTL ? "flex-start" : "flex-end", gap: 2 }}>
                    <Text style={[type.label, { color: theme.text }]}>{USD(num(l.shares_to_sell) * num(l.asking_price_per_share))}</Text>
                    <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={14} color={theme.textMuted} />
                  </View>
                </Card>
              </FadeInView>
            ))
          ) : (
            <Card style={styles.emptyMini}><Text style={[type.caption, { color: theme.textMuted, textAlign: "center" }]}>{t("home.marketEmpty", "No listings on the secondary market yet.")}</Text></Card>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function SectionHead({ title, onSeeAll, t, theme, type, isRTL, styles, inset }) {
  return (
    <View style={[styles.sectionHead, !inset && { paddingHorizontal: 20 }]}>
      <Text style={[type.label, { color: theme.text }]}>{title}</Text>
      <Pressable onPress={onSeeAll} hitSlop={6} style={styles.seeAll}>
        <Text style={[type.caption, { color: theme.primaryDark, fontWeight: "700" }]}>{t("home.seeAll", "See all")}</Text>
        <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={14} color={theme.primaryDark} />
      </Pressable>
    </View>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    header: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 10,
      gap: 12,
    },
    headerIcons: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 },
    iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: theme.surfaceAlt },
    notifDot: { position: "absolute", top: 9, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: theme.primary },

    muLabel: { color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5, textAlign: isRTL ? "right" : "left" },
    pvTop: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
    growthChip: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },

    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
    gridCellWrap: { width: "47%" },
    gridCell: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: 14,
      backgroundColor: theme.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      minHeight: 64,
    },
    vpIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: theme.primary + "22" },

    sectionHead: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" },
    seeAll: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 2 },
    sliderRow: { flexDirection: "row", gap: 12 },

    listRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 },
    listIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: theme.primary + "1A" },
    emptyMini: { paddingVertical: 22, alignItems: "center" },
  });
