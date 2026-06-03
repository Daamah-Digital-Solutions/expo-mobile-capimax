// Opportunity card for the Funds list. Renders the key fields + badges from a live
// opportunity object (API_AND_FLOWS.md §4.1). Theme-aware (light/dark), RTL-aware.
import React, { useMemo } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

function formatNumber(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return String(v ?? "");
  return n.toLocaleString("en-US");
}

function Chip({ icon, label, theme, tone = "neutral" }) {
  const bg =
    tone === "primary" ? theme.primary + "22" : tone === "success" ? theme.success + "22" : theme.surfaceAlt;
  const fg = tone === "primary" ? theme.primary : tone === "success" ? theme.success : theme.textSecondary;
  return (
    <View style={[chipStyles.chip, { backgroundColor: bg, borderColor: theme.border }]}>
      {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
      <Text style={[chipStyles.chipText, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function OpportunityCard({ opportunity, onPress }) {
  const { t } = useTranslation();
  const { theme, radius } = useTheme();
  const { isRTL } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, radius, isRTL), [theme, radius, isRTL]);

  const o = opportunity || {};
  const verified = o.cim_verification_enabled || o.cim_verification?.enabled;
  const rated = o.cim_rating_enabled || o.cim_rating?.enabled;
  const hcc = o.hcc_insurance_enabled || o.hcc_insurance?.enabled;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {o.cover_image_url ? (
        <Image source={{ uri: o.cover_image_url }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.coverFallback]}>
          <Ionicons name="image-outline" size={28} color={theme.textMuted} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {o.title}
          </Text>
          {o.status ? (
            <View style={[styles.statusBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.statusText}>{String(o.status)}</Text>
            </View>
          ) : null}
        </View>

        {/* Badges */}
        <View style={styles.badges}>
          {o.country ? <Chip icon="location-outline" label={o.country} theme={theme} /> : null}
          {o.contract_type ? <Chip icon="document-text-outline" label={String(o.contract_type).toUpperCase()} theme={theme} /> : null}
          {o.insurance ? <Chip icon="shield-checkmark-outline" label={t("common.yes", "Insured")} theme={theme} tone="success" /> : null}
          {verified ? <Chip icon="checkmark-circle-outline" label="CIM Verified" theme={theme} tone="primary" /> : null}
          {rated ? <Chip icon="star-outline" label="CIM Rated" theme={theme} tone="primary" /> : null}
          {hcc ? <Chip icon="shield-outline" label="HCC Insured" theme={theme} tone="success" /> : null}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{t("common.shares", "shares")}</Text>
            <Text style={styles.statValue}>{formatNumber(o.available_shares)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{t("opportunity.pricePerShare", "Price/Share")}</Text>
            <Text style={styles.statValue}>${formatNumber(o.price_per_share)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: { fontSize: 11, fontWeight: "600" },
});

const makeStyles = (theme, radius, isRTL) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: radius.card,
      overflow: "hidden",
      marginBottom: 14,
    },
    cover: { width: "100%", height: 160, backgroundColor: theme.surfaceAlt },
    coverFallback: { alignItems: "center", justifyContent: "center" },
    body: { padding: 14, gap: 10 },
    titleRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 8,
    },
    title: { flex: 1, color: theme.text, fontSize: 16, fontWeight: "800", textAlign: isRTL ? "right" : "left" },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    statusText: { color: theme.onPrimary, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
    badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: isRTL ? "flex-end" : "flex-start" },
    statsRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      backgroundColor: theme.surfaceAlt,
      borderRadius: radius.sm,
      paddingVertical: 10,
      marginTop: 2,
    },
    stat: { flex: 1, alignItems: "center", gap: 2 },
    statDivider: { width: 1, alignSelf: "stretch", backgroundColor: theme.border },
    statLabel: { color: theme.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
    statValue: { color: theme.text, fontSize: 15, fontWeight: "700" },
  });
