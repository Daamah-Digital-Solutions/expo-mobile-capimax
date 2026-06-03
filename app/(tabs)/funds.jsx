import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import Screen from "../../src/components/Screen";
import Banner from "../../src/components/Banner";
import AppButton from "../../src/components/AppButton";
import Chip from "../../src/components/Chip";
import Card from "../../src/components/Card";
import Skeleton from "../../src/components/Skeleton";
import EmptyState from "../../src/components/EmptyState";
import AssetCard from "../../src/components/AssetCard";
import FadeInView from "../../src/components/motion/FadeInView";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { opportunityService } from "../../src/api/services";
import i18n from "../../src/i18n";

const COUNTRIES = ["all", "UAE", "Saudi Arabia", "USA", "UK"];

export default function FundsTab() {
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { language } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, radii, spacing), [theme, radii, spacing]);

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("all"); // stores name_en (or "all")
  const [country, setCountry] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showDebug, setShowDebug] = useState(true);
  const [debug, setDebug] = useState({});

  const apiUrl = Constants.expoConfig?.extra?.apiUrl;

  const fetchOpportunities = useCallback(async () => {
    setError("");
    try {
      const res = await opportunityService.getOpportunities({ categoryName: category, country });
      const results = Array.isArray(res?.data?.results) ? res.data.results : [];
      setItems(results);
      setDebug({
        status: res?.status,
        count: res?.data?.count,
        parsed: results.length,
        url: res?.config?.url,
        lang: res?.config?.headers?.["Accept-Language"],
        error: null,
      });
    } catch (err) {
      setItems([]);
      const status = err?.response?.status ?? "network-error";
      setError(err?.response?.data?.message || err?.message || t("common.error", "Error"));
      setDebug({ status, count: null, parsed: 0, url: err?.config?.url, lang: err?.config?.headers?.["Accept-Language"], error: err?.message });
    }
  }, [category, country, t]);

  // Categories (single fetch — each item carries name_en, so no double-fetch needed).
  useEffect(() => {
    (async () => {
      try {
        const res = await opportunityService.getCategories(i18n.language);
        setCategories(Array.isArray(res?.data?.results) ? res.data.results : []);
      } catch {
        setCategories([]);
      }
    })();
  }, [language]);

  useEffect(() => {
    setLoading(true);
    fetchOpportunities().finally(() => setLoading(false));
  }, [fetchOpportunities]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOpportunities().finally(() => setRefreshing(false));
  }, [fetchOpportunities]);

  const DebugPanel = (
    <Card padded style={styles.debug} level="none">
      <View style={styles.debugHeader}>
        <Text style={[type.micro, styles.debugTitle]}>DEBUG · data path</Text>
        <Ionicons
          name={showDebug ? "chevron-up" : "chevron-down"}
          size={16}
          color={theme.textSecondary}
          onPress={() => setShowDebug((s) => !s)}
        />
      </View>
      {showDebug ? (
        <View style={{ gap: 2 }}>
          <Text style={styles.debugLine}>baseURL: {String(apiUrl)}</Text>
          <Text style={styles.debugLine}>Accept-Language: {String(debug.lang ?? i18n.language)}</Text>
          <Text style={styles.debugLine}>GET url: {String(debug.url ?? "/api/opportunities/")}</Text>
          <Text style={styles.debugLine}>HTTP status: {String(debug.status ?? "—")}</Text>
          <Text style={styles.debugLine}>
            envelope count: {String(debug.count ?? "—")} · parsed results[]: {String(debug.parsed ?? "—")}
          </Text>
          <Text style={styles.debugLine}>filters → category: {category} · country: {country}</Text>
          <Text style={[styles.debugLine, debug.error && { color: theme.error }]}>error: {String(debug.error ?? "—")}</Text>
        </View>
      ) : null}
    </Card>
  );

  const Filters = (
    <View style={{ gap: 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
        {COUNTRIES.map((c) => (
          <Chip key={c} label={c === "all" ? t("common.all", "All") : c} selected={country === c} onPress={() => setCountry(c)} />
        ))}
      </ScrollView>
      {categories.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          <Chip label={t("common.all", "All")} selected={category === "all"} onPress={() => setCategory("all")} />
          {categories.map((cat) => (
            <Chip key={cat.id ?? cat.name_en} label={cat.name} selected={category === cat.name_en} onPress={() => setCategory(cat.name_en)} />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  const Header = (
    <View style={styles.header}>
      <View style={styles.counterRow}>
        <Text style={[type.h1, { color: theme.text }]}>{t("sidebar.funds", "Assets")}</Text>
        <Text style={[type.caption, { color: theme.textSecondary }]}>
          {items.length} {t("common.opportunities", "Assets")}
        </Text>
      </View>
      {Filters}
      {error ? (
        <View style={{ gap: 10, marginTop: 4 }}>
          <Banner type="error" message={error} actionLabel={t("common.submit", "Retry")} onAction={onRefresh} />
        </View>
      ) : null}
      {DebugPanel}
    </View>
  );

  if (loading) {
    return (
      <Screen>
        <View style={styles.listContent}>
          {Header}
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} styles={styles} radii={radii} />
          ))}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <FadeInView index={index} style={{ marginBottom: 14 }}>
            <AssetCard opportunity={item} />
          </FadeInView>
        )}
        ListHeaderComponent={Header}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon="albums-outline"
              title={t("common.opportunities", "No assets")}
              message={t("form.please_fill_in_information", "Try adjusting your filters.")}
              actionLabel={t("common.all", "Clear filters")}
              onAction={() => {
                setCategory("all");
                setCountry("all");
              }}
            />
          ) : null
        }
      />
    </Screen>
  );
}

function SkeletonCard({ styles, radii }) {
  return (
    <Card padded={false} style={{ marginBottom: 14 }}>
      <Skeleton width="100%" height={0} radius={0} style={{ aspectRatio: 16 / 10 }} />
      <View style={{ padding: 16, gap: 10 }}>
        <Skeleton width="70%" height={20} radius={6} />
        <Skeleton width="40%" height={14} radius={6} />
        <View style={{ flexDirection: "row", gap: 16, marginTop: 6 }}>
          <Skeleton width={90} height={28} radius={8} />
          <Skeleton width={90} height={28} radius={8} />
        </View>
        <Skeleton width="100%" height={52} radius={radii.button} />
      </View>
    </Card>
  );
}

const makeStyles = (theme, radii, spacing) =>
  StyleSheet.create({
    listContent: { padding: spacing.xl, gap: 0 },
    header: { gap: 14, marginBottom: 14 },
    counterRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
    chipScroll: { gap: 8, paddingVertical: 2 },
    debug: { backgroundColor: theme.surface, borderColor: theme.borderStrong, borderWidth: StyleSheet.hairlineWidth, gap: 6 },
    debugHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    debugTitle: { color: theme.textSecondary, fontWeight: "800", letterSpacing: 1 },
    debugLine: { color: theme.textMuted, fontSize: 11 },
  });
