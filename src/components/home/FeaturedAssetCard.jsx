// Compact horizontal asset card for the Home "Featured assets" slider. Photo-forward (these
// have property images), tight body: cover + title + price/share + one badge. Tapping opens the
// opportunity detail (the Buy action lives there — no money words on Home).
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import Card from "../Card";
import Badge from "../Badge";
import ReturnPill from "../ReturnPill";
import Skeleton from "../Skeleton";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

function money(v) {
  const n = parseFloat(v);
  if (Number.isNaN(n)) return String(v ?? "—");
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function FeaturedAssetCard({ opportunity, onPress, width = 240 }) {
  const { t } = useTranslation();
  const { theme, type, radii } = useTheme();
  const { isRTL } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const o = opportunity || {};
  const [loaded, setLoaded] = useState(false);
  const imgOpacity = useSharedValue(0);
  const imgStyle = useAnimatedStyle(() => ({ opacity: imgOpacity.value }));
  const onImgLoad = () => { setLoaded(true); imgOpacity.value = withTiming(1, { duration: 200 }); };

  const verified = o.cim_verification_enabled || o.cim_verification?.enabled;
  const roi = o.roi_percentage != null ? Number(o.roi_percentage) : null;

  return (
    <Card pressable onPress={onPress} padded={false} style={{ width, overflow: "hidden" }}>
      <View style={styles.cover}>
        {o.cover_image_url ? (
          <>
            {!loaded ? <Skeleton width="100%" height="100%" radius={0} style={StyleSheet.absoluteFill} /> : null}
            <Animated.Image source={{ uri: o.cover_image_url }} style={[StyleSheet.absoluteFill, imgStyle]} resizeMode="cover" onLoad={onImgLoad} />
          </>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.fallback]}>
            <Ionicons name="business-outline" size={28} color={theme.textMuted} />
          </View>
        )}
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.35)"]} style={styles.scrim} pointerEvents="none" />
        <View style={styles.overlayTop}>
          {o.contract_type ? <Badge label={String(o.contract_type).toUpperCase()} icon="document-text-outline" onImage /> : <View />}
          {roi != null ? <ReturnPill value={roi} onImage /> : null}
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{o.title}</Text>
        <View style={styles.row}>
          <View style={{ gap: 2, alignItems: isRTL ? "flex-end" : "flex-start" }}>
            <Text style={[type.caption, styles.muted]}>{t("opportunity.pricePerShare", "Price / share")}</Text>
            <Text style={[type.statNumber, { color: theme.text }]}>${money(o.price_per_share)}</Text>
          </View>
          {verified ? <Badge label={t("opportunity.cimVerified", "CIM Verified")} icon="checkmark-circle-outline" tone="primary" /> : null}
        </View>
      </View>
    </Card>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    cover: { width: "100%", height: 124, backgroundColor: theme.surfaceAlt },
    fallback: { alignItems: "center", justifyContent: "center" },
    scrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "60%" },
    overlayTop: {
      position: "absolute", top: 10, left: 10, right: 10,
      flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "flex-start",
    },
    body: { padding: 12, gap: 10 },
    title: { color: theme.text, fontSize: 16, fontWeight: "600", lineHeight: 20, textAlign: isRTL ? "right" : "left" },
    row: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8 },
    muted: { color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.4 },
  });
