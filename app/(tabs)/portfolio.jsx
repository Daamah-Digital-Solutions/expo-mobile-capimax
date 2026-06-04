import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../../src/components/Screen";
import Card from "../../src/components/Card";
import Banner from "../../src/components/Banner";
import Skeleton from "../../src/components/Skeleton";
import EmptyState from "../../src/components/EmptyState";
import FadeInView from "../../src/components/motion/FadeInView";
import PerformanceChart from "../../src/components/portfolio/PerformanceChart";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { portfolioService } from "../../src/api/services";

const USD = (v) => `$${(parseFloat(v) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PCT = (v) => { const n = parseFloat(v) || 0; return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`; };
const compact = (n) => { const v = Number(n) || 0; return Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`; };

export default function PortfolioTab() {
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, isRTL), [theme, isRTL]);

  const [data, setData] = useState(null); // portfolio_data
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const trend = (v) => (parseFloat(v) >= 0 ? theme.positive : theme.negative);

  const fetchData = useCallback(async () => {
    setError("");
    try {
      const res = await portfolioService.getMyPortfolio(24);
      if (res?.data?.success) {
        setData(res.data.portfolio_data || null);
      } else {
        throw new Error(res?.data?.error || t("portfolio.error", "Failed to load portfolio data"));
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || t("portfolio.error", "Failed to load portfolio data"));
      throw err;
    }
  }, [t]);

  useEffect(() => {
    setLoading(true);
    fetchData().catch(() => {}).finally(() => setLoading(false));
  }, [fetchData]);

  // Refresh recomputes server-side, then refetches (matches web handleRefreshPortfolio).
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await portfolioService.refresh();
    } catch {}
    await fetchData().catch(() => {});
    setRefreshing(false);
  };

  const header = (
    <View style={styles.titleRow}>
      <View style={{ gap: 2, flex: 1 }}>
        <Text style={[type.h1, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>{t("portfolio.title", "Portfolio Performance")}</Text>
        <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{t("portfolio.subtitle", "Track your asset growth and performance metrics")}</Text>
      </View>
      <Pressable onPress={onRefresh} hitSlop={8} disabled={refreshing} style={styles.refreshBtn}>
        <Ionicons name="refresh" size={20} color={refreshing ? theme.textMuted : theme.primary} />
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <Screen edges={["top"]}>
        <View style={{ padding: spacing.xl, gap: 14 }}>
          {header}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Skeleton width="48%" height={84} radius={radii.card} />
            <Skeleton width="48%" height={84} radius={radii.card} />
          </View>
          <Skeleton width="100%" height={260} radius={radii.card} />
          <Skeleton width="100%" height={200} radius={radii.card} />
        </View>
      </Screen>
    );
  }

  if (error && !data) {
    return (
      <Screen edges={["top"]}>
        <View style={{ padding: spacing.xl, gap: 16 }}>
          {header}
          <Banner type="error" message={error} actionLabel={t("common.retry", "Retry")} onAction={() => { setLoading(true); fetchData().catch(() => {}).finally(() => setLoading(false)); }} />
        </View>
      </Screen>
    );
  }

  const cd = data?.chart_data;
  const stats = data?.current_stats || {};
  const hasData = Array.isArray(cd?.labels) && cd.labels.length > 0;

  if (!hasData) {
    return (
      <Screen edges={["top"]}>
        <View style={{ padding: spacing.xl, gap: 16 }}>
          {header}
          <EmptyState icon="stats-chart-outline" title={t("portfolio.noData", "No portfolio data available")} message={t("portfolio.noDataMsg", "Buy some assets to see your performance!")} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}
      >
        {header}

        {/* Stat cards */}
        <FadeInView index={0} style={styles.statsRow}>
          <StatCard label={t("portfolio.totalInvested", "Total Purchased")} value={USD(stats.total_invested)} theme={theme} type={type} isRTL={isRTL} />
          <StatCard label={t("portfolio.totalValue", "Total Value")} value={USD(stats.total_value)} color={theme.positive} theme={theme} type={type} isRTL={isRTL} />
        </FadeInView>
        <FadeInView index={1} style={styles.statsRow}>
          <StatCard label={t("portfolio.totalGrowth", "Total Growth")} value={USD(stats.total_growth)} color={trend(stats.total_growth)} sub={PCT(stats.growth_percentage)} subColor={trend(stats.growth_percentage)} theme={theme} type={type} isRTL={isRTL} />
          <StatCard label={t("portfolio.avgMonthlyReturn", "Avg Monthly")} value={PCT(stats.average_monthly_return)} color={trend(stats.average_monthly_return)} theme={theme} type={type} isRTL={isRTL} />
        </FadeInView>

        {/* Main performance chart */}
        <FadeInView index={2}>
          <Card style={{ gap: 8 }}>
            <View style={styles.chartHead}>
              <Text style={[type.label, { color: theme.text }]}>{t("portfolio.performanceChart", "Performance Chart")}</Text>
              <View style={styles.rangePill}><Text style={[type.micro, { color: theme.primaryDark }]}>{t("portfolio.last24Months", "Last 24 Months")}</Text></View>
            </View>
            <PerformanceChart
              labels={cd.labels}
              height={240}
              formatY={compact}
              series={[
                { key: t("portfolio.totalValue", "Total Value"), values: cd.total_value, color: theme.primary },
                { key: t("portfolio.investedCapital", "Purchased Capital"), values: cd.invested_capital, color: theme.info },
                { key: t("portfolio.growthAmount", "Growth"), values: cd.growth_amount, color: theme.warning },
              ]}
            />
          </Card>
        </FadeInView>

        {/* Growth % trend */}
        <FadeInView index={3}>
          <Card style={{ gap: 8 }}>
            <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>{t("portfolio.growthTrend", "Growth % Trend")}</Text>
            <PerformanceChart
              labels={cd.labels}
              height={180}
              formatY={(n) => `${(Number(n) || 0).toFixed(0)}%`}
              series={[{ key: t("portfolio.growthPercentage", "Growth %"), values: cd.growth_percentage, color: theme.positive }]}
            />
          </Card>
        </FadeInView>

        {/* Performance stats */}
        <FadeInView index={4}>
          <Card style={{ gap: 0 }}>
            <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left", marginBottom: 6 }]}>{t("portfolio.performanceStats", "Performance Stats")}</Text>
            <StatRow label={t("portfolio.bestMonthReturn", "Best Month")} value={PCT(stats.best_month_return)} color={trend(stats.best_month_return)} styles={styles} theme={theme} type={type} first />
            <StatRow label={t("portfolio.worstMonthReturn", "Worst Month")} value={PCT(stats.worst_month_return)} color={trend(stats.worst_month_return)} styles={styles} theme={theme} type={type} />
            <StatRow label={t("portfolio.dataPoints", "Data Points")} value={`${data.data_points ?? cd.labels.length} ${t("portfolio.months", "months")}`} color={theme.text} styles={styles} theme={theme} type={type} />
          </Card>
        </FadeInView>
      </ScrollView>
    </Screen>
  );
}

function StatCard({ label, value, color, sub, subColor, theme, type, isRTL }) {
  return (
    <Card style={{ flex: 1, gap: 4 }}>
      <Text style={[type.caption, { color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>{label}</Text>
      <Text style={[type.statNumber, { color: color || theme.text, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>{value}</Text>
      {sub ? <Text style={[type.caption, { color: subColor || theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>{sub}</Text> : null}
    </Card>
  );
}

function StatRow({ label, value, color, styles, theme, type, first }) {
  return (
    <View style={[styles.statRow, first && { borderTopWidth: 0 }]}>
      <Text style={[type.body, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[type.label, { color }]}>{value}</Text>
    </View>
  );
}

const makeStyles = (theme, isRTL) =>
  StyleSheet.create({
    titleRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    refreshBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: theme.surfaceAlt },
    statsRow: { flexDirection: isRTL ? "row-reverse" : "row", gap: 12 },
    chartHead: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" },
    rangePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: theme.primary + "22" },
    statRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
  });
