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
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";

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
import PartnerLogo from "../../src/components/PartnerLogo";
import PlatformLogo from "../../src/components/PlatformLogo";
import { PLATFORMS, PRONOVA_URL } from "../../src/constants/platforms";
import { ACCREDITATIONS } from "../../src/constants/accreditations";

const USD = (v) => `$${(parseFloat(v) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (v) => parseFloat(v) || 0;
const PCT = (v) => { const n = parseFloat(v) || 0; return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`; };

// "Why Capimax" — the 8 competitive advantages requested by the client (icon-led, no live numbers).
// `nova` is the strategic Nova-financing integration → rendered highlighted.
const VALUE_PROPS = [
  { icon: "earth-outline", key: "globalAssets" },
  { icon: "people-outline", key: "globalInvest" },
  { icon: "shield-checkmark-outline", key: "insured" },
  { icon: "swap-horizontal-outline", key: "exit" },
  { icon: "checkmark-done-circle-outline", key: "verify" },
  { icon: "card-outline", key: "payments" },
  { icon: "pulse-outline", key: "realtime" },
  { icon: "git-network-outline", key: "nova" },
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

  const openUrl = async (url) => { try { await WebBrowser.openBrowserAsync(url); } catch {} };

  // ── Header: centered logo on top; greeting (start) + wallet (end) below ──────
  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <View style={styles.logoRow}>
        <Logo height={28} />
      </View>
      <View style={styles.greetRow}>
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{t("home.welcomeBack", "Welcome back")}</Text>
          <Text style={[type.h2, { color: theme.text, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>{username || t("account.user", "User")}</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={() => router.push("/wallet")} hitSlop={6}>
          <Ionicons name="wallet-outline" size={22} color={theme.text} />
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

        {/* ── Featured assets (kept, moved up) ── */}
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

        {/* ── Why Capimax → 8 competitive-advantage tiles (Nova integration highlighted) ── */}
        <View style={{ paddingHorizontal: spacing.xl, gap: 12 }}>
          <SectionHead title={t("home.whyTitle", "Why Capimax")} t={t} theme={theme} type={type} isRTL={isRTL} styles={styles} inset />
          <Text style={styles.secSub}>{t("home.whySubtitle", "Eight reasons investors choose the Capimax ecosystem.")}</Text>
          <View style={styles.grid}>
            {VALUE_PROPS.map((vp, i) => {
              const hi = vp.key === "nova";
              return (
                <FadeInView key={vp.key} index={Math.min(i, 7)} style={styles.gridCellWrap}>
                  <LinearGradient
                    colors={hi ? [theme.primary + "2E", theme.surface] : [theme.surfaceAlt, theme.card]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.4, y: 1 }}
                    style={[styles.vpCard, hi && styles.vpCardHi]}
                  >
                    {hi ? (
                      <LinearGradient colors={[theme.primaryLight, theme.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.vpIconHi}>
                        <Ionicons name={vp.icon} size={22} color={theme.onPrimary} />
                      </LinearGradient>
                    ) : (
                      <View style={styles.vpIcon}>
                        <Ionicons name={vp.icon} size={22} color={theme.primary} />
                      </View>
                    )}
                    <Text style={styles.vpTitle} numberOfLines={2}>{t(`home.vp_${vp.key}`)}</Text>
                    <Text style={styles.vpDesc} numberOfLines={3}>{t(`home.vpd_${vp.key}`)}</Text>
                    {hi ? (
                      <View style={styles.vpBadge}><Text style={styles.vpBadgeText}>{t("home.featuredBadge", "Featured")}</Text></View>
                    ) : null}
                  </LinearGradient>
                </FadeInView>
              );
            })}
          </View>
        </View>

        {/* ── Our Platforms — the wider Capimax ecosystem ── */}
        <View style={{ gap: 10 }}>
          <SectionHead title={t("platforms.sectionTitle", "Our Platforms")} onSeeAll={() => router.push("/platforms")} t={t} theme={theme} type={type} isRTL={isRTL} styles={styles} />
          <FlatList
            data={PLATFORMS}
            keyExtractor={(p) => p.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 12 }}
            renderItem={({ item: p }) => (
              <Pressable onPress={() => openUrl(p.url)}>
                <LinearGradient colors={["#1c2a48", "#0e1626"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.platCard, { borderColor: p.accent + "55" }]}>
                  <LinearGradient colors={[p.accent + "33", "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.platGlow} pointerEvents="none" />
                  <View style={styles.platTagRow}>
                    <View style={[styles.platTag, { backgroundColor: p.accent + "1F", borderColor: p.accent + "44" }]}>
                      <Text style={[styles.platTagText, { color: p.accent }]} numberOfLines={1}>{t(`platforms.tags.${p.key}`)}</Text>
                    </View>
                  </View>
                  <View style={styles.platLogoBox}>
                    <PlatformLogo logo={p.logo} boxW={162} boxH={46} />
                  </View>
                  <Text style={styles.platName} numberOfLines={1}>{p.name}</Text>
                  <View style={styles.platVisitRow}>
                    <Text style={[styles.platUrl, { color: p.accent }]} numberOfLines={1}>{p.url.replace(/^https?:\/\//, "")}</Text>
                    <Ionicons name="open-outline" size={13} color={p.accent} />
                  </View>
                </LinearGradient>
              </Pressable>
            )}
          />
        </View>

        {/* ── Access Pronova ecosystem CTA ── */}
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Pressable onPress={() => openUrl(PRONOVA_URL)}>
            <LinearGradient colors={["#2ead6f", "#1f8a54"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pronovaCta}>
              <View style={styles.pronovaIcon}><Ionicons name="sparkles-outline" size={22} color={theme.onPrimary} /></View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[type.label, { color: theme.onPrimary, textAlign: isRTL ? "right" : "left" }]}>{t("home.accessPronova", "Access Pronova")}</Text>
                <Text style={[type.caption, { color: theme.onPrimary, opacity: 0.85, textAlign: isRTL ? "right" : "left" }]}>{t("home.accessPronovaDesc", "Explore the Pronova ecosystem")}</Text>
              </View>
              <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={20} color={theme.onPrimary} />
            </LinearGradient>
          </Pressable>
        </View>

        {/* ── Strategic Partners — CIM / HCC / Assurax (real brand logos on light chips) ── */}
        <View style={{ paddingHorizontal: spacing.xl, gap: 10 }}>
          <SectionHead title={t("home.partnersTitle", "Strategic Partners")} t={t} theme={theme} type={type} isRTL={isRTL} styles={styles} inset />
          <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left", lineHeight: 18 }]}>
            {t("home.partnersDesc", "Backed by leading financial, insurance, and verification institutions.")}
          </Text>
          <View style={styles.partnersRow}>
            {ACCREDITATIONS.map((p) => (
              <View key={p.key} style={styles.partnerChip}>
                <PartnerLogo name={p.logo} height={30} />
              </View>
            ))}
          </View>
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
      <View style={styles.sectionTitleWrap}>
        <View style={styles.sectionBar} />
        <Text style={styles.sectionTitle} numberOfLines={1}>{title}</Text>
      </View>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={6} style={styles.seeAll}>
          <Text style={[type.caption, { color: theme.primaryDark, fontWeight: "700" }]}>{t("home.seeAll", "See all")}</Text>
          <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={14} color={theme.primaryDark} />
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: 20,
      paddingBottom: 10,
      gap: 12,
    },
    logoRow: { alignItems: "center", paddingBottom: 2 },
    greetRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: theme.surfaceAlt },

    muLabel: { color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5, textAlign: isRTL ? "right" : "left" },
    pvTop: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
    growthChip: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },

    grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 12, justifyContent: "space-between" },
    gridCellWrap: { width: "48%" },
    secSub: { color: theme.textMuted, fontSize: 12.5, lineHeight: 18, marginTop: -4, textAlign: isRTL ? "right" : "left" },
    vpCard: {
      flex: 1,
      overflow: "hidden",
      alignItems: isRTL ? "flex-end" : "flex-start",
      gap: 11,
      padding: 15,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      minHeight: 150,
    },
    vpCardHi: { borderColor: theme.primary + "66" },
    vpIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: theme.primary + "18", borderWidth: 1, borderColor: theme.primary + "33" },
    vpIconHi: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    vpTitle: { color: theme.text, fontSize: 14.5, fontWeight: "700", lineHeight: 19, textAlign: isRTL ? "right" : "left" },
    vpDesc: { color: theme.textSecondary, fontSize: 12, lineHeight: 17, textAlign: isRTL ? "right" : "left" },
    vpBadge: { position: "absolute", top: 12, right: isRTL ? undefined : 12, left: isRTL ? 12 : undefined, backgroundColor: theme.primary, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
    vpBadgeText: { color: theme.onPrimary, fontSize: 8.5, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },

    platCard: {
      width: 200,
      padding: 16,
      borderRadius: 22,
      gap: 12,
      borderWidth: 1,
      overflow: "hidden",
    },
    platGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 96 },
    platTagRow: { flexDirection: isRTL ? "row-reverse" : "row" },
    platTag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
    platTagText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
    platLogoBox: {
      height: 74,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.045)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.06)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    platName: { color: "#FFFFFF", fontWeight: "800", fontSize: 16, textAlign: isRTL ? "right" : "left" },
    platVisitRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4, marginTop: -4 },
    platUrl: { fontSize: 11.5, fontFamily: "monospace", letterSpacing: 0.2, textAlign: isRTL ? "right" : "left" },

    partnersRow: { flexDirection: isRTL ? "row-reverse" : "row", gap: 10 },
    partnerChip: {
      flex: 1,
      backgroundColor: "#FFFFFF",
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 8,
      minHeight: 64,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },

    pronovaCta: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 12,
      padding: 16,
      borderRadius: radii.card,
    },
    pronovaIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)" },

    sectionHead: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    sectionTitleWrap: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 9, flexShrink: 1 },
    sectionBar: { width: 4, height: 20, borderRadius: 2, backgroundColor: theme.primary },
    sectionTitle: { color: theme.text, fontSize: 18.5, fontWeight: "800", letterSpacing: 0.2, flexShrink: 1 },
    seeAll: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 2, backgroundColor: theme.primary + "14", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
    sliderRow: { flexDirection: "row", gap: 12 },

    listRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 },
    listIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: theme.primary + "1A" },
    emptyMini: { paddingVertical: 22, alignItems: "center" },
  });
