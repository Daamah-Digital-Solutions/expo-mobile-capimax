import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Pressable, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import Screen from "../../src/components/Screen";
import Banner from "../../src/components/Banner";
import Button from "../../src/components/Button";
import OpportunityCard from "../../src/components/OpportunityCard";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { opportunityService } from "../../src/api/services";
import i18n from "../../src/i18n";

const COUNTRIES = ["all", "UAE", "Saudi Arabia", "USA", "UK"];

export default function FundsTab() {
  const { t } = useTranslation();
  const { theme, radius } = useTheme();
  const { language } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, radius), [theme, radius]);

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
      setDebug({
        status,
        count: null,
        parsed: 0,
        url: err?.config?.url,
        lang: err?.config?.headers?.["Accept-Language"],
        error: err?.message,
      });
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
    <View style={styles.debug}>
      <View style={styles.debugHeader}>
        <Text style={styles.debugTitle}>DEBUG · data path</Text>
        <Pressable onPress={() => setShowDebug((s) => !s)} hitSlop={10}>
          <Ionicons name={showDebug ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
        </Pressable>
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
    </View>
  );

  const FilterChips = (
    <View style={{ gap: 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
        {COUNTRIES.map((c) => (
          <FilterChip
            key={c}
            label={c === "all" ? t("common.all", "All") : c}
            active={country === c}
            onPress={() => setCountry(c)}
            styles={styles}
          />
        ))}
      </ScrollView>
      {categories.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          <FilterChip label={t("common.all", "All")} active={category === "all"} onPress={() => setCategory("all")} styles={styles} />
          {categories.map((cat) => (
            <FilterChip
              key={cat.id ?? cat.name_en}
              label={cat.name}
              active={category === cat.name_en}
              onPress={() => setCategory(cat.name_en)}
              styles={styles}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  const Header = (
    <View style={styles.header}>
      <View style={styles.counterRow}>
        <Text style={styles.heading}>{t("sidebar.funds", "Assets")}</Text>
        <Text style={styles.counter}>
          {items.length} {t("common.opportunities", "Assets")}
        </Text>
      </View>
      {FilterChips}
      {error ? (
        <View style={{ gap: 10, marginTop: 4 }}>
          <Banner type="error" message={error} />
          <Button title={t("common.submit", "Retry")} variant="outline" onPress={onRefresh} icon="refresh" />
        </View>
      ) : null}
      {DebugPanel}
    </View>
  );

  if (loading) {
    return (
      <Screen>
        {/* still show the debug panel so a hang/blank is never silent */}
        <View style={styles.centerWrap}>
          {Header}
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.muted}>{t("common.loading", "Loading...")}</Text>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <OpportunityCard opportunity={item} />}
        ListHeaderComponent={Header}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          !error ? (
            <View style={styles.center}>
              <Ionicons name="albums-outline" size={44} color={theme.textMuted} />
              <Text style={styles.muted}>{t("common.opportunities", "No assets found")}</Text>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

function FilterChip({ label, active, onPress, styles }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const makeStyles = (theme, radius) =>
  StyleSheet.create({
    listContent: { padding: 16 },
    centerWrap: { flex: 1, padding: 16 },
    header: { gap: 12, marginBottom: 8 },
    counterRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
    heading: { color: theme.text, fontSize: 24, fontWeight: "800" },
    counter: { color: theme.textSecondary, fontSize: 13, fontWeight: "600" },
    chipScroll: { gap: 8, paddingVertical: 2 },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
    },
    filterChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
    filterChipText: { color: theme.textSecondary, fontSize: 13, fontWeight: "600" },
    filterChipTextActive: { color: theme.onPrimary },
    center: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 10, flexGrow: 1 },
    muted: { color: theme.textSecondary, fontSize: 14 },
    debug: {
      backgroundColor: theme.surface,
      borderColor: theme.borderStrong,
      borderWidth: 1,
      borderRadius: radius.sm,
      padding: 10,
      gap: 6,
    },
    debugHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    debugTitle: { color: theme.textSecondary, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
    debugLine: { color: theme.textMuted, fontSize: 11, fontFamily: undefined },
  });
