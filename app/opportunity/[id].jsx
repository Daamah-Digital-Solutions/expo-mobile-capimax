import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image, Pressable, Linking, ActivityIndicator, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

import Screen from "../../src/components/Screen";
import Card from "../../src/components/Card";
import Badge from "../../src/components/Badge";
import ReturnPill from "../../src/components/ReturnPill";
import StatTile from "../../src/components/StatTile";
import AppButton from "../../src/components/AppButton";
import Banner from "../../src/components/Banner";
import Skeleton from "../../src/components/Skeleton";
import EmptyState from "../../src/components/EmptyState";
import SectionHeader from "../../src/components/SectionHeader";
import FadeInView from "../../src/components/motion/FadeInView";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { useAuth } from "../../src/context/AuthContext";
import { opportunityService } from "../../src/api/services";
import { htmlToText } from "../../src/utils/html";
import { downloadDocumentLink } from "../../src/utils/fileDownload";

function money(v, opts) {
  const n = parseFloat(v);
  if (Number.isNaN(n)) return String(v ?? "—");
  return n.toLocaleString("en-US", opts);
}

// Maps each document URL field to its web label key (opportunity.*).
const DOC_FIELDS = [
  ["request_copy_url", "requestForm"],
  ["investement_offer_copy_url", "investmentOffer"],
  ["acceptance_investement_offer_copy_url", "investmentOfferAcceptance"],
  ["investement_document_contract_summary_url", "investmentContractSummary"],
  ["agency_based_investement_agreement_url", "agencyBasedInvestmentAgreement"],
  ["investement_agreement_url", "investmentAgreement"],
];

export default function OpportunityDetail() {
  const params = useLocalSearchParams();
  const id = params.id;
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL, language } = useLanguage();
  const { isAuthenticated, setPendingRoute } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(theme, radii, insets, isRTL), [theme, radii, insets, isRTL]);

  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [busyDoc, setBusyDoc] = useState(null); // doc.key currently downloading
  const [docMsg, setDocMsg] = useState(null); // { type, text }

  // Preview = open the link externally to view (current behaviour). Download = save to device.
  const previewDoc = (url) => { if (url) Linking.openURL(url); };

  const mapDocErr = (e) => {
    switch (e?.code) {
      case "expired": return t("documentCenter.errExpired", "Your session expired. Please sign in again.");
      case "notfound": return t("documentCenter.errNotFound", "Document not found.");
      case "noshare": return t("documentCenter.errNoShare", "Sharing is not available on this device.");
      default: return t("documentCenter.errFailed", "Download failed. Please try again.");
    }
  };

  const downloadDoc = async (d) => {
    setBusyDoc(d.key);
    setDocMsg(null);
    try {
      const r = await downloadDocumentLink({ url: d.url, fileName: d.label });
      setDocMsg(
        r?.mode === "opened"
          ? { type: "info", text: t("opportunity.previewFallback", "Couldn't save this file directly — opened it for viewing instead.") }
          : { type: "success", text: t("documentCenter.downloadReady", "Ready — choose where to save or share it.") }
      );
    } catch (e) {
      setDocMsg({ type: "error", text: mapDocErr(e) });
    } finally {
      setBusyDoc(null);
    }
  };

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await opportunityService.getOpportunity(id);
      setOpp(res?.data || null);
    } catch (err) {
      setOpp(null);
      setError(err?.response?.data?.message || err?.message || t("common.error", "Error"));
    }
  }, [id, t]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  // Buy lives inside the detail page (Phase 4 wires the real payment flow).
  const onBuy = () => {
    const target = `/invest/${id}`;
    if (!isAuthenticated) {
      setPendingRoute(target); // return here after login (Flow A)
      router.push("/(auth)/login");
    } else {
      router.push(target);
    }
  };

  const BackButton = (
    <Pressable style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => router.back()} hitSlop={8}>
      <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color="#FFFFFF" />
    </Pressable>
  );

  if (loading) {
    return (
      <Screen edges={["bottom"]}>
        {BackButton}
        <Skeleton width={width} height={(width * 10) / 16} radius={0} />
        <View style={{ padding: spacing.xl, gap: 12 }}>
          <Skeleton width="70%" height={24} radius={6} />
          <Skeleton width="40%" height={14} radius={6} />
          <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
            <Skeleton width="48%" height={70} radius={radii.card} />
            <Skeleton width="48%" height={70} radius={radii.card} />
          </View>
          <Skeleton width="100%" height={120} radius={radii.card} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        {BackButton}
        <View style={styles.centerState}>
          <Banner type="error" message={error} actionLabel={t("common.submit", "Retry")} onAction={() => { setLoading(true); load().finally(() => setLoading(false)); }} />
          <AppButton title={t("opportunity.backToOpportunities", "Back to Assets")} variant="secondary" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (!opp) {
    return (
      <Screen>
        {BackButton}
        <EmptyState
          icon="search-outline"
          title={t("opportunity.notFound", "Asset not found")}
          actionLabel={t("opportunity.backToOpportunities", "Back to Assets")}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const o = opp;
  const heroH = (width * 10) / 16;

  // Gallery: primary first, then order; fall back to cover image.
  const images =
    Array.isArray(o.images) && o.images.length
      ? [...o.images].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || (a.order ?? 0) - (b.order ?? 0))
      : o.cover_image_url
      ? [{ image_url: o.cover_image_url }]
      : [];

  const verified = o.cim_verification_enabled || o.cim_verification?.enabled;
  const rated = o.cim_rating_enabled || o.cim_rating?.enabled;
  const hcc = o.hcc_insurance_enabled || o.hcc_insurance?.enabled;
  const roi = o.roi_percentage != null ? Number(o.roi_percentage) : null;
  const caption = images[galleryIndex] ? (language === "ar" ? images[galleryIndex].caption_ar : images[galleryIndex].caption_en) : null;
  const description = htmlToText(o.description);

  const verifications = [
    o.cim_verification?.enabled && { key: "v", title: t("opportunity.cimVerification", "CIM Verification"), linkLabel: t("opportunity.goToVerificationLink", "Verify externally"), codeLabel: t("opportunity.verificationCode", "Verification Code"), ...o.cim_verification },
    o.cim_rating?.enabled && { key: "r", title: t("opportunity.cimRating", "CIM Rating"), linkLabel: t("opportunity.goToRatingLink", "Check the rating"), codeLabel: t("opportunity.ratingCode", "Rating Code"), ...o.cim_rating },
    o.hcc_insurance?.enabled && { key: "h", title: t("opportunity.hccInsurance", "HCC Insurance"), linkLabel: t("opportunity.goToInsuranceLink", "Verify the insurance"), codeLabel: t("opportunity.insuranceCode", "Insurance Code"), ...o.hcc_insurance },
  ].filter(Boolean);

  const docs = DOC_FIELDS.filter(([field]) => o[field]).map(([field, key]) => ({ key, label: t(`opportunity.${key}`), url: o[field] }));

  return (
    <Screen edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Hero gallery */}
        <View style={{ height: heroH, backgroundColor: theme.surfaceAlt }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setGalleryIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {images.length ? (
              images.map((img, i) => <HeroImage key={i} uri={img.image_url} width={width} height={heroH} />)
            ) : (
              <View style={[{ width, height: heroH }, styles.fallback]}>
                <Ionicons name="business-outline" size={40} color={theme.textMuted} />
              </View>
            )}
          </ScrollView>

          <LinearGradient colors={["rgba(0,0,0,0.25)", "transparent", "rgba(0,0,0,0.45)"]} style={StyleSheet.absoluteFill} pointerEvents="none" />

          <View style={[styles.heroTop, { top: insets.top + 8 }]}>
            <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
              <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color="#FFFFFF" />
            </Pressable>
            {roi != null ? <ReturnPill value={roi} onImage /> : null}
          </View>

          <View style={styles.heroBottom}>
            {o.contract_type ? <Badge label={String(o.contract_type).toUpperCase()} icon="document-text-outline" onImage /> : null}
            {o.status ? <Badge label={String(o.status)} tone="positive" onImage /> : null}
          </View>

          {images.length > 1 ? (
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === galleryIndex && styles.dotActive]} />
              ))}
            </View>
          ) : null}
        </View>

        {caption ? <Text style={[type.caption, styles.caption]}>{caption}</Text> : null}

        <View style={styles.body}>
          {/* Title + location + code */}
          <FadeInView index={0}>
            <Text style={styles.title}>{o.title}</Text>
            <View style={styles.metaRow}>
              {o.country ? (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                  <Text style={[type.caption, { color: theme.textSecondary }]}>{o.country}</Text>
                </View>
              ) : null}
              {o.category?.name ? (
                <View style={styles.metaItem}>
                  <Ionicons name="pricetag-outline" size={14} color={theme.textSecondary} />
                  <Text style={[type.caption, { color: theme.textSecondary }]}>{o.category.name}</Text>
                </View>
              ) : null}
              {o.code ? (
                <View style={styles.metaItem}>
                  <Ionicons name="barcode-outline" size={14} color={theme.textSecondary} />
                  <Text style={[type.caption, { color: theme.textSecondary }]}>
                    {t("opportunity.investmentCode", "Asset Code")}: {o.code}
                  </Text>
                </View>
              ) : null}
            </View>
          </FadeInView>

          {/* Trust badges */}
          {(verified || rated || hcc || o.insurance === true) ? (
            <FadeInView index={1} style={styles.badges}>
              {verified ? <Badge label={t("opportunity.cimVerified", "CIM Verified")} icon="checkmark-circle-outline" tone="primary" /> : null}
              {rated ? <Badge label={t("opportunity.cimRated", "CIM Rated")} icon="star-outline" tone="primary" /> : null}
              {hcc ? <Badge label={t("opportunity.hccInsured", "HCC Insured")} icon="shield-checkmark-outline" tone="positive" /> : null}
              {o.insurance === true ? <Badge label={t("opportunity.insured", "Insured")} icon="shield-outline" tone="positive" /> : null}
            </FadeInView>
          ) : null}

          {/* Big-number stats */}
          <FadeInView index={2} style={styles.statsGrid}>
            <StatTile label={t("opportunity.pricePerShare", "Price / share")} value={`$${money(o.price_per_share, { maximumFractionDigits: 0 })}`} />
            <StatTile label={t("opportunity.availableShares", "Available Shares")} value={money(o.available_shares)} />
          </FadeInView>
          <FadeInView index={3} style={styles.statsGrid}>
            <StatTile label={t("opportunity.roi", "Returns")} value={roi != null ? `${roi.toFixed(2)}%` : "—"} />
            <StatTile label={t("opportunity.duration", "Duration")} value={o.duration != null ? `${o.duration} ${t("opportunity.months", "months")}` : "—"} />
          </FadeInView>

          {/* Overview */}
          {description ? (
            <FadeInView index={4} style={{ gap: 10 }}>
              <SectionHeader title={t("opportunity.quickInfo", "Overview")} />
              <Text style={[type.body, { color: theme.textSecondary }]}>{description}</Text>
            </FadeInView>
          ) : null}

          {/* Asset Information */}
          <FadeInView index={5} style={{ gap: 10 }}>
            <SectionHeader title={t("opportunity.investmentInformation", "Asset Information")} />
            <Card style={{ gap: 0 }}>
              <DetailRow label={t("opportunity.status", "Status")} value={o.status} styles={styles} theme={theme} type={type} isRTL={isRTL} first />
              <DetailRow label={t("opportunity.totalInvestment", "Total Asset Value")} value={`$${money(o.total_investment)}`} styles={styles} theme={theme} type={type} isRTL={isRTL} />
              <DetailRow label={t("opportunity.contractType", "Contract Type")} value={o.contract_type ? String(o.contract_type).toUpperCase() : "—"} styles={styles} theme={theme} type={type} isRTL={isRTL} />
              <DetailRow label={t("opportunity.insurance", "Insurance")} value={o.insurance === true ? t("common.yes", "Yes") : "—"} styles={styles} theme={theme} type={type} isRTL={isRTL} />
              <DetailRow label={t("opportunity.minShares", "Minimum Shares")} value={money(o.minimum_shares)} styles={styles} theme={theme} type={type} isRTL={isRTL} />
              {o.profit_payment_system ? (
                <DetailRow label={t("opportunity.paymentSystem", "Profit Payment System")} value={o.profit_payment_system} styles={styles} theme={theme} type={type} isRTL={isRTL} />
              ) : null}
            </Card>
          </FadeInView>

          {/* Verification & Ratings */}
          {verifications.length ? (
            <FadeInView index={6} style={{ gap: 10 }}>
              <SectionHeader title={t("opportunity.verificationAndRatings", "Verification & Ratings")} />
              {verifications.map((v) => (
                <Card key={v.key} style={{ gap: 8 }}>
                  <View style={styles.verHeader}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={theme.primary} />
                    <Text style={[type.label, { color: theme.text }]}>{v.title}</Text>
                  </View>
                  {v.display_text ? <Text style={[type.caption, { color: theme.textSecondary }]}>{v.display_text}</Text> : null}
                  {v.code ? <Text style={[type.caption, { color: theme.textMuted }]}>{v.codeLabel}: {v.code}</Text> : null}
                  {v.link ? (
                    <AppButton title={v.linkLabel} variant="secondary" fullWidth={false} icon="open-outline" onPress={() => Linking.openURL(v.link)} />
                  ) : null}
                </Card>
              ))}
            </FadeInView>
          ) : null}

          {/* Important Documents — Preview (view) + Download (save to device) */}
          {docs.length ? (
            <FadeInView index={7} style={{ gap: 10 }}>
              <SectionHeader title={t("opportunity.importantDocuments", "Important Documents")} />
              {docMsg ? <Banner type={docMsg.type} message={docMsg.text} /> : null}
              <Card style={{ gap: 0 }}>
                {docs.map((d, i) => (
                  <View key={d.key} style={[styles.docItem, i === 0 && { borderTopWidth: 0 }]}>
                    <View style={styles.docLeft}>
                      <Ionicons name="document-text-outline" size={18} color={theme.primary} />
                      <Text style={[type.body, { color: theme.text, flexShrink: 1 }]} numberOfLines={2}>{d.label}</Text>
                    </View>
                    <View style={styles.docActions}>
                      <Pressable style={styles.docBtn} onPress={() => previewDoc(d.url)} hitSlop={6}>
                        <Ionicons name="eye-outline" size={15} color={theme.primaryDark} />
                        <Text style={[type.caption, { color: theme.primaryDark, fontWeight: "600" }]}>{t("common.download", "Preview")}</Text>
                      </Pressable>
                      <Pressable style={[styles.docBtn, styles.docBtnPrimary, busyDoc && busyDoc !== d.key && { opacity: 0.5 }]} onPress={() => downloadDoc(d)} hitSlop={6} disabled={!!busyDoc}>
                        {busyDoc === d.key ? (
                          <ActivityIndicator size="small" color={theme.primaryDark} />
                        ) : (
                          <Ionicons name="download-outline" size={15} color={theme.primaryDark} />
                        )}
                        <Text style={[type.caption, { color: theme.primaryDark, fontWeight: "700" }]}>{t("documentCenter.download", "Download")}</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </Card>
            </FadeInView>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky Buy bar — the primary action lives inside the detail page. */}
      <View style={[styles.buyBar, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.buyPrice}>
          <Text style={[type.caption, { color: theme.textMuted }]}>{t("opportunity.pricePerShare", "Price / share")}</Text>
          <Text style={[type.statNumber, { color: theme.text }]}>${money(o.price_per_share, { maximumFractionDigits: 0 })}</Text>
        </View>
        <AppButton title={t("common.invest", "Buy")} onPress={onBuy} fullWidth={false} style={styles.buyBtn} icon="cart-outline" />
      </View>
    </Screen>
  );
}

function HeroImage({ uri, width, height }) {
  const opacity = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.Image
      source={{ uri }}
      style={[{ width, height }, style]}
      resizeMode="cover"
      onLoad={() => (opacity.value = withTiming(1, { duration: 200 }))}
    />
  );
}

function DetailRow({ label, value, styles, theme, type, isRTL, first }) {
  return (
    <View style={[styles.detailRow, first && { borderTopWidth: 0 }]}>
      <Text style={[type.caption, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "left" : "right", flexShrink: 1 }]} numberOfLines={2}>
        {value ?? "—"}
      </Text>
    </View>
  );
}

const makeStyles = (theme, radii, insets, isRTL) =>
  StyleSheet.create({
    fallback: { alignItems: "center", justifyContent: "center" },
    backBtn: {
      position: "absolute",
      left: 16,
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.4)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.22)",
      zIndex: 5,
    },
    heroTop: {
      position: "absolute",
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    heroBottom: {
      position: "absolute",
      bottom: 14,
      left: 16,
      right: 16,
      flexDirection: isRTL ? "row-reverse" : "row",
      gap: 6,
      justifyContent: isRTL ? "flex-end" : "flex-start",
    },
    dots: { position: "absolute", bottom: 14, alignSelf: "center", flexDirection: "row", gap: 5 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.45)" },
    dotActive: { backgroundColor: "#FFFFFF", width: 16 },
    caption: { color: theme.textMuted, paddingHorizontal: 20, paddingTop: 8, textAlign: isRTL ? "right" : "left" },

    body: { padding: 20, gap: 22 },
    title: { color: theme.text, fontSize: 24, fontWeight: "600", lineHeight: 30, textAlign: isRTL ? "right" : "left" },
    metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 8, justifyContent: isRTL ? "flex-end" : "flex-start" },
    metaItem: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 },
    badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: isRTL ? "flex-end" : "flex-start" },
    statsGrid: { flexDirection: isRTL ? "row-reverse" : "row", gap: 12 },

    detailRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    verHeader: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 },

    docItem: {
      gap: 10,
      paddingVertical: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    docLeft: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10, flexShrink: 1 },
    docActions: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10 },
    docBtn: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 5,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: radii.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
      minHeight: 36,
    },
    docBtnPrimary: { backgroundColor: theme.primary + "22", borderColor: theme.primary },

    centerState: { flex: 1, justifyContent: "center", padding: 20, gap: 16 },

    buyBar: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      paddingHorizontal: 20,
      paddingTop: 10,
      backgroundColor: theme.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    buyPrice: { gap: 1 },
    buyBtn: { minWidth: 160, paddingHorizontal: 28 },
  });
