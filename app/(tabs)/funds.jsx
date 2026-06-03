import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Screen from "../../src/components/Screen";
import Banner from "../../src/components/Banner";
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
  const router = useRouter();
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

  const fetchOpportunities = useCallback(async () => {
    setError("");
    try {
      const res = await opportunityService.getOpportunities({ categoryName: category, country });
      const results = Array.isArray(res?.data?.results) ? res.data.results : [];
      setItems(results);
    } catch (err) {
      setItems([]);
      setError(err?.response?.data?.message || err?.message || t("common.error", "Error"));
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

  const Filters = (
    <View style={styles.filters}>
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
      {error ? <Banner type="error" message={error} actionLabel={t("common.submit", "Retry")} onAction={onRefresh} /> : null}
    </View>
  );

  if (loading) {
    return (
      <Screen>
        <View style={styles.listContent}>
          {Header}
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} radii={radii} />
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
            {/* "Learn More" / card tap → opportunity detail page (built next phase). */}
            <AssetCard opportunity={item} onPress={() => router.push(`/opportunity/${item.id}`)} />
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

function SkeletonCard({ radii }) {
  return (
    <Card padded={false} style={{ marginBottom: 14 }}>
      <Skeleton width="100%" height={0} radius={0} style={{ aspectRatio: 16 / 10 }} />
      <View style={{ padding: 16, gap: 10 }}>
        <Skeleton width="70%" height={18} radius={6} />
        <Skeleton width="40%" height={13} radius={6} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 4 }}>
          <Skeleton width={80} height={30} radius={8} />
          <Skeleton width={80} height={30} radius={8} />
          <Skeleton width={84} height={40} radius={12} style={{ marginLeft: "auto" }} />
        </View>
      </View>
    </Card>
  );
}

const makeStyles = (theme, radii, spacing) =>
  StyleSheet.create({
    listContent: { padding: spacing.xl },
    // Generous gap between the filter block and the first card (Stake "air").
    header: { gap: 14, marginBottom: 22 },
    counterRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
    filters: { gap: 10 },
    chipScroll: { gap: 8, paddingVertical: 2 },
  });
