// AssetCard (DESIGN.md §7) — the hero card for the Funds list.
// Full-bleed 16:10 cover + scrim, type chip (top-start), return pill (top-end), body with
// title/location/trust badges/divider/two stat columns + CTA. Photo-forward, big-number.
import React, { useMemo, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import Card from "./Card";
import Badge from "./Badge";
import ReturnPill from "./ReturnPill";
import AppButton from "./AppButton";
import Skeleton from "./Skeleton";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

function money(v) {
  const n = parseFloat(v);
  if (Number.isNaN(n)) return String(v ?? "—");
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function AssetCard({ opportunity, onPress, ctaLabel }) {
  const { t } = useTranslation();
  const { theme, type, radii } = useTheme();
  const { isRTL } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const o = opportunity || {};
  const [loaded, setLoaded] = useState(false);
  const imgOpacity = useSharedValue(0);
  const imgStyle = useAnimatedStyle(() => ({ opacity: imgOpacity.value }));

  const onImgLoad = () => {
    setLoaded(true);
    imgOpacity.value = withTiming(1, { duration: 200 });
  };

  const verified = o.cim_verification_enabled || o.cim_verification?.enabled;
  const rated = o.cim_rating_enabled || o.cim_rating?.enabled;
  const hcc = o.hcc_insurance_enabled || o.hcc_insurance?.enabled;
  const roi = o.roi_percentage != null ? Number(o.roi_percentage) : null;

  return (
    <Card pressable onPress={onPress} padded={false}>
      {/* Cover image */}
      <View style={styles.cover}>
        {o.cover_image_url ? (
          <>
            {!loaded ? <Skeleton width="100%" height="100%" radius={0} style={StyleSheet.absoluteFill} /> : null}
            <Animated.Image
              source={{ uri: o.cover_image_url }}
              style={[StyleSheet.absoluteFill, imgStyle]}
              resizeMode="cover"
              onLoad={onImgLoad}
            />
          </>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.fallback]}>
            <Ionicons name="business-outline" size={32} color={theme.textMuted} />
          </View>
        )}

        {/* bottom scrim for legibility */}
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.35)"]} style={styles.scrim} pointerEvents="none" />

        {/* overlays */}
        <View style={styles.overlayTop}>
          {o.contract_type ? <Badge label={String(o.contract_type).toUpperCase()} icon="document-text-outline" onImage /> : <View />}
          {roi != null ? <ReturnPill value={roi} onImage /> : null}
        </View>
        {o.status ? (
          <View style={styles.overlayBottom}>
            <Badge label={String(o.status)} tone="positive" onImage />
          </View>
        ) : null}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={[type.h2, styles.title]} numberOfLines={2}>
          {o.title}
        </Text>

        {o.country ? (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
            <Text style={[type.caption, { color: theme.textSecondary }]}>{o.country}</Text>
          </View>
        ) : null}

        {(verified || rated || hcc || o.insurance) ? (
          <View style={styles.badges}>
            {verified ? <Badge label="CIM Verified" icon="checkmark-circle-outline" tone="primary" /> : null}
            {rated ? <Badge label="CIM Rated" icon="star-outline" tone="primary" /> : null}
            {hcc ? <Badge label="HCC Insured" icon="shield-checkmark-outline" tone="positive" /> : null}
            {o.insurance ? <Badge label={t("common.yes", "Insured")} icon="shield-outline" tone="positive" /> : null}
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[type.caption, styles.statLabel]}>{t("opportunity.pricePerShare", "Price / share")}</Text>
            <Text style={[type.statNumber, styles.statValue]}>${money(o.price_per_share)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[type.caption, styles.statLabel]}>{t("common.shares", "Available")}</Text>
            <Text style={[type.statNumber, styles.statValue]}>{money(o.available_shares)}</Text>
          </View>
        </View>

        <AppButton
          title={ctaLabel || t("common.viewDetails", "View details")}
          variant="secondary"
          onPress={onPress}
          icon={isRTL ? "chevron-back" : "chevron-forward"}
          style={styles.cta}
        />
      </View>
    </Card>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    cover: { width: "100%", aspectRatio: 16 / 10, backgroundColor: theme.surfaceAlt },
    fallback: { alignItems: "center", justifyContent: "center" },
    scrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "55%" },
    overlayTop: {
      position: "absolute",
      top: 12,
      left: 12,
      right: 12,
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    overlayBottom: {
      position: "absolute",
      bottom: 12,
      left: 12,
      right: 12,
      flexDirection: isRTL ? "row-reverse" : "row",
    },
    body: { padding: 16, gap: 10 },
    title: { color: theme.text, textAlign: isRTL ? "right" : "left" },
    metaRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 },
    badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: isRTL ? "flex-end" : "flex-start" },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginVertical: 2 },
    statsRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center" },
    stat: { flex: 1, gap: 3, alignItems: isRTL ? "flex-end" : "flex-start" },
    statLabel: { color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
    statValue: { color: theme.text },
    statDivider: { width: StyleSheet.hairlineWidth, alignSelf: "stretch", backgroundColor: theme.border, marginHorizontal: 12 },
    cta: { marginTop: 6 },
  });
