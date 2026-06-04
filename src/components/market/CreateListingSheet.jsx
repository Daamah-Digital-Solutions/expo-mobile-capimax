// Create Listing (Internal-market SELL — Flow E) in a BottomSheet, matching the web's
// Create Listing dialog. Only reachable for a holding with can_sell_shares === true.
//   POST /api/internal-market/create-listing/
//     { investment_id, shares_to_sell (int), asking_price_per_share (float), listing_type }
//   listing_type: 'normal' (≤30 days, 2% fee) | 'fast' (immediate, ~7.5% discount + 5% fee).
//   On success the web reloads → mobile calls onSuccess() (parent closes + refetches).
// The financial breakdown below is DISPLAY-ONLY (client-side), exactly per the web math.
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import BottomSheet from "../BottomSheet";
import Field from "../Field";
import AppButton from "../AppButton";
import Banner from "../Banner";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { internalMarketService } from "../../api/services";

const USD = (v) => `$${(parseFloat(v) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Mirrors the web calculateFinancialBreakdown() exactly (display only).
function breakdownOf(shares, price, type) {
  const sh = parseInt(shares, 10);
  const pr = parseFloat(price);
  if (!sh || !pr || sh <= 0 || pr <= 0) return null;
  const totalValue = sh * pr;
  if (type === "normal") {
    const platformFee = totalValue * 0.02;
    return { totalValue, platformFee, platformFeeRate: 2, netProceeds: totalValue - platformFee, type: "normal" };
  }
  const discount = totalValue * 0.075; // average of 5–10%
  const discounted = totalValue - discount;
  const platformFee = discounted * 0.05;
  return { totalValue, discount, discountRate: 7.5, platformFee, platformFeeRate: 5, netProceeds: discounted - platformFee, type: "fast" };
}

export default function CreateListingSheet({ visible, holding, onClose, onSuccess }) {
  const { t } = useTranslation();
  const { theme, radii, type } = useTheme();
  const { isRTL } = useLanguage();
  const { height } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const [listingType, setListingType] = useState("normal");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      setListingType("normal");
      setShares("");
      setPrice("");
      setError("");
      setLoading(false);
    }
  }, [visible]);

  const maxShares = parseInt(holding?.shares_available_for_sale, 10) || 0;
  const sharesNum = parseInt(shares, 10) || 0;
  const priceNum = parseFloat(price) || 0;
  const tooMany = sharesNum > maxShares;

  const canSubmit = !loading && sharesNum > 0 && priceNum > 0 && !tooMany;

  const breakdown = breakdownOf(shares, price, listingType);

  const submit = async () => {
    if (!holding) return;
    setLoading(true);
    setError("");
    try {
      await internalMarketService.createListing({
        investment_id: holding.investment_id,
        shares_to_sell: sharesNum,
        asking_price_per_share: priceNum,
        listing_type: listingType,
      });
      onSuccess?.();
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || t("internalMarket.createListingError", "Failed to create listing"));
    }
  };

  const SALE_TYPES = [
    {
      value: "normal",
      title: t("internalMarket.normalSale", "Normal Sale (Owner-to-Owner)"),
      desc: t("internalMarket.normalSaleDesc", "Listed for up to 30 days · Lower fee (2%) · Other owners can buy"),
    },
    {
      value: "fast",
      title: t("internalMarket.fastSale", "Fast Sale (Buyback Fund)"),
      desc: t("internalMarket.fastSaleDesc", "Immediate liquidity · 5–10% discount · Higher fee (5%)"),
    },
  ];

  return (
    <BottomSheet visible={visible} onClose={loading ? () => {} : onClose} title={t("internalMarket.createListing", "Create Listing")}>
      <ScrollView
        style={{ maxHeight: height * 0.66 }}
        contentContainerStyle={{ gap: 14, paddingBottom: 4 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        {holding ? (
          <View style={{ gap: 2 }}>
            <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>
              {t("internalMarket.investment", "Asset")}: {holding.investment_opportunity?.title || "—"}
            </Text>
            <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>
              {t("internalMarket.availableToSell", "Available to Sell")}: {maxShares} {t("internalMarket.shares", "Shares")}
            </Text>
          </View>
        ) : null}

        {error ? <Banner type="error" message={error} /> : null}

        {/* Sale type */}
        <View style={{ gap: 10 }}>
          <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>{t("internalMarket.saleType", "Sale Type")}</Text>
          {SALE_TYPES.map((st) => {
            const active = listingType === st.value;
            return (
              <Pressable key={st.value} onPress={() => setListingType(st.value)} style={[styles.option, active && styles.optionActive]}>
                <View style={[styles.radio, active && { borderColor: theme.primary }]}>
                  {active ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>{st.title}</Text>
                  <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{st.desc}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Field
          label={t("internalMarket.sharesToSell", "Shares to Sell")}
          value={shares}
          onChangeText={(v) => setShares(v.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          placeholder={String(maxShares)}
          error={tooMany ? t("internalMarket.tooManyShares", "Only {{count}} shares available to sell", { count: maxShares }) : undefined}
        />
        <Field
          label={t("internalMarket.pricePerShare", "Price per Share")}
          value={price}
          onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ""))}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />

        {/* Financial breakdown (display only) */}
        {breakdown ? (
          <View style={styles.breakdown}>
            <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left", marginBottom: 2 }]}>{t("internalMarket.financialBreakdown", "Financial Breakdown")}</Text>
            <Row label={t("internalMarket.totalListingValue", "Total Listing Value")} value={USD(breakdown.totalValue)} theme={theme} type={type} isRTL={isRTL} />
            {breakdown.type === "fast" ? (
              <Row label={t("internalMarket.buybackDiscount", "Buyback Discount ({{rate}}%)", { rate: breakdown.discountRate })} value={`- ${USD(breakdown.discount)}`} color={theme.warning} theme={theme} type={type} isRTL={isRTL} />
            ) : null}
            <Row label={t("internalMarket.platformFeeRate", "Platform Fee ({{rate}}%)", { rate: breakdown.platformFeeRate })} value={`- ${USD(breakdown.platformFee)}`} color={theme.textMuted} theme={theme} type={type} isRTL={isRTL} />
            <View style={styles.netRow}>
              <Text style={[type.label, { color: theme.primaryDark }]}>{t("internalMarket.netProceeds", "Net Proceeds to You")}</Text>
              <Text style={[type.label, { color: theme.primaryDark, fontWeight: "800" }]}>{USD(breakdown.netProceeds)}</Text>
            </View>
            {breakdown.type === "fast" ? (
              <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{t("internalMarket.fastSaleNote", "Fast Sale: immediate payment to your wallet.")}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.actions}>
          <AppButton title={t("common.cancel", "Cancel")} variant="ghost" fullWidth={false} onPress={loading ? undefined : onClose} disabled={loading} />
          <AppButton title={t("internalMarket.createListing", "Create Listing")} fullWidth={false} style={{ minWidth: 160 }} loading={loading} disabled={!canSubmit} onPress={submit} />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

function Row({ label, value, color, theme, type, isRTL }) {
  return (
    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 4 }}>
      <Text style={[type.caption, { color: theme.textSecondary, flexShrink: 1, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>{label}</Text>
      <Text style={[type.caption, { color: color || theme.text }]}>{value}</Text>
    </View>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    option: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "flex-start",
      gap: 12,
      padding: 12,
      borderRadius: radii.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
    },
    optionActive: { borderColor: theme.primary, backgroundColor: theme.primary + "14" },
    radio: {
      width: 22, height: 22, borderRadius: 11, marginTop: 1,
      borderWidth: 2, borderColor: theme.borderStrong,
      alignItems: "center", justifyContent: "center",
    },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary },
    breakdown: {
      gap: 2,
      padding: 14,
      borderRadius: radii.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
    },
    netRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingTop: 8,
      marginTop: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.borderStrong,
    },
    actions: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 2 },
  });
