// AssetCard (DESIGN.md §7) — the hero card for the Funds list.
// Photo-forward 16:10 cover + scrim, type chip (top-start), return pill (top-end), compact body
// with title (h2/600, tight leading), location, ≤2 trust badges (+N), and an inline stats+CTA row.
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import Card from "./Card";
import Badge from "./Badge";
import ReturnPill from "./ReturnPill";
import Skeleton from "./Skeleton";
import PressableScale from "./motion/PressableScale";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

function money(v) {
  const n = parseFloat(v);
  if (Number.isNaN(n)) return String(v ?? "—");
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function AssetCard({ opportunity, onPress }) {
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

  // Trust badges — priority CIM Verified + Insured, then the rest; show at most 2 (+N).
  const badgeDefs = [];
  if (verified) badgeDefs.push({ key: "v", label: t("opportunity.cimVerified", "CIM Verified"), icon: "checkmark-circle-outline", tone: "primary" });
  if (o.insurance === true) badgeDefs.push({ key: "i", label: t("opportunity.insured", "Insured"), icon: "shield-checkmark-outline", tone: "positive" });
  if (rated) badgeDefs.push({ key: "r", label: t("opportunity.cimRated", "CIM Rated"), icon: "star-outline", tone: "primary" });
  if (hcc) badgeDefs.push({ key: "h", label: t("opportunity.hccInsured", "HCC Insured"), icon: "shield-outline", tone: "positive" });
  const shownBadges = badgeDefs.slice(0, 2);
  const extraBadges = badgeDefs.length - shownBadges.length;

  return (
    <Card pressable onPress={onPress} padded={false}>
      {/* Cover image */}
      <View style={styles.cover}>
        {o.cover_image_url ? (
          <>
            {!loaded ? <Skeleton width="100%" height="100%" radius={0} style={StyleSheet.absoluteFill} /> : null}
            <Animated.Image source={{ uri: o.cover_image_url }} style={[StyleSheet.absoluteFill, imgStyle]} resizeMode="cover" onLoad={onImgLoad} />
          </>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.fallback]}>
            <Ionicons name="business-outline" size={32} color={theme.textMuted} />
          </View>
        )}

        <LinearGradient colors={["transparent", "rgba(0,0,0,0.35)"]} style={styles.scrim} pointerEvents="none" />

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
        <Text style={styles.title} numberOfLines={2}>
          {o.title}
        </Text>

        {o.country ? (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
            <Text style={[type.caption, { color: theme.textSecondary }]}>{o.country}</Text>
          </View>
        ) : null}

        {shownBadges.length ? (
          <View style={styles.badges}>
            {shownBadges.map((b) => (
              <Badge key={b.key} label={b.label} icon={b.icon} tone={b.tone} />
            ))}
            {extraBadges > 0 ? <Badge label={`+${extraBadges}`} tone="neutral" /> : null}
          </View>
        ) : null}

        <View style={styles.divider} />

        {/* Inline stats + CTA (Stake density) */}
        <View style={styles.statsRow}>
          <View style={styles.statsGroup}>
            <View style={styles.stat}>
              <Text style={[type.caption, styles.statLabel]}>{t("opportunity.pricePerShare", "Price / share")}</Text>
              <Text style={[type.statNumber, styles.statValue]}>${money(o.price_per_share)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[type.caption, styles.statLabel]}>{t("opportunity.available", "Available")}</Text>
              <Text style={[type.statNumber, styles.statValue]}>{money(o.available_shares)}</Text>
            </View>
          </View>

          {/* Single card action: "Learn More" → opens the opportunity detail page.
              The Buy action lives inside the detail page, not on the card. */}
          <PressableScale style={styles.cta} onPress={onPress}>
            <Text style={[type.label, styles.ctaText]}>{t("common.learnMore", "Learn More")}</Text>
            <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={theme.primaryDark} />
          </PressableScale>
        </View>
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
    overlayBottom: { position: "absolute", bottom: 12, left: 12, right: 12, flexDirection: isRTL ? "row-reverse" : "row" },

    body: { padding: 16, gap: 8 },
    // h2 size but explicitly 600 + tighter leading (~1.25) — the "premium vs generic" lever.
    title: { color: theme.text, fontSize: 20, fontWeight: "600", lineHeight: 25, textAlign: isRTL ? "right" : "left" },
    metaRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 },
    badges: { flexDirection: "row", flexWrap: "nowrap", gap: 6, justifyContent: isRTL ? "flex-end" : "flex-start" },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginTop: 2 },

    statsRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", marginTop: 2 },
    statsGroup: { flex: 1, flexDirection: isRTL ? "row-reverse" : "row", gap: 22 },
    stat: { gap: 2, alignItems: isRTL ? "flex-end" : "flex-start" },
    statLabel: { color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.4 },
    statValue: { color: theme.text },

    // Secondary (navigational) button — primary outline, not a green money CTA.
    cta: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 3,
      height: 40,
      paddingHorizontal: 16,
      borderRadius: radii.button,
      borderWidth: 1,
      borderColor: theme.primary,
      backgroundColor: "transparent",
    },
    ctaText: { color: theme.primaryDark, fontWeight: "700" },
  });
