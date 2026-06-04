// Account (Phase 8) — read-only profile from GET /api/users/me/, mirroring web pages/account.
// Profile header + Account Information + Document Verification Status. Links to Edit Profile
// (Flow H) and Change Password. Zero mock; skeleton / error states; both modes + RTL.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../src/components/Screen";
import Card from "../src/components/Card";
import Banner from "../src/components/Banner";
import AppButton from "../src/components/AppButton";
import Skeleton from "../src/components/Skeleton";
import FadeInView from "../src/components/motion/FadeInView";
import { useTheme } from "../src/context/ThemeContext";
import { useLanguage } from "../src/context/LanguageContext";
import { userService } from "../src/api/services";
import { COUNTRIES } from "../src/constants/countries";

function fmtDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); } catch { return String(iso); }
}

const VS = {
  verified: { icon: "shield-checkmark", color: "positive", titleKey: "account.statusVerified", titleDefault: "Documents Verified" },
  pending: { icon: "time", color: "warning", titleKey: "account.statusPending", titleDefault: "Under Review" },
  not_submitted: { icon: "alert-circle", color: "error", titleKey: "account.statusNotSubmitted", titleDefault: "Documents Not Submitted" },
};

export default function AccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchProfile = useCallback(async () => {
    setError("");
    try {
      const res = await userService.me();
      setProfile(res?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t("account.loadError", "Failed to load your account"));
      throw err;
    }
  }, [t]);

  useEffect(() => {
    setLoading(true);
    fetchProfile().catch(() => {}).finally(() => setLoading(false));
  }, [fetchProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile().catch(() => {}).finally(() => setRefreshing(false));
  };

  const nationalityLabel = (code) => {
    if (!code) return t("account.notProvided", "Not provided");
    const c = COUNTRIES.find((x) => x.value === code);
    return c ? c.label : code;
  };

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <Pressable style={styles.headerBack} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color={theme.text} />
      </Pressable>
      <Text style={[type.label, { color: theme.text }]}>{t("account.title", "My Account")}</Text>
      <View style={styles.headerBack} />
    </View>
  );

  if (loading) {
    return (
      <Screen edges={["bottom"]}>
        {Header}
        <View style={{ padding: spacing.xl, gap: 14 }}>
          <Skeleton width="100%" height={120} radius={radii.card} />
          <Skeleton width="100%" height={200} radius={radii.card} />
          <Skeleton width="100%" height={120} radius={radii.card} />
        </View>
      </Screen>
    );
  }

  if (error && !profile) {
    return (
      <Screen edges={["bottom"]}>
        {Header}
        <View style={{ padding: spacing.xl, gap: 16 }}>
          <Banner type="error" message={error} actionLabel={t("common.retry", "Retry")} onAction={() => { setLoading(true); fetchProfile().catch(() => {}).finally(() => setLoading(false)); }} />
        </View>
      </Screen>
    );
  }

  const p = profile || {};
  const ds = p.document_status;
  const vs = ds ? VS[ds.verification_status] || VS.not_submitted : null;
  const professionText = p.custom_profession || p.profession || t("account.notSpecified", "Not Specified");
  const initial = (p.user_details?.username || p.username || "U").charAt(0).toUpperCase();

  const vsMessage = () => {
    if (!ds) return "";
    if (ds.verification_status === "verified") return t("account.statusVerifiedMsg", "Verified on {{date}}", { date: fmtDate(ds.documents_verified_at) });
    if (ds.verification_status === "pending") return ds.verification_notes || t("account.statusPendingMsg", "Your documents are being reviewed");
    return t("account.statusNotSubmittedMsg", "Please submit your identification documents");
  };

  return (
    <Screen edges={["bottom"]}>
      {Header}
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}
      >
        {/* Profile header */}
        <FadeInView index={0}>
          <Card style={{ alignItems: "center", gap: 8, paddingVertical: 22 }}>
            <View style={styles.avatar}><Text style={[type.h1, { color: theme.onPrimary }]}>{initial}</Text></View>
            <Text style={[type.h2, { color: theme.text, textAlign: "center" }]}>{p.user_details?.username || p.username || t("account.user", "User")}</Text>
            <Text style={[type.body, { color: theme.textSecondary, textAlign: "center", textTransform: "capitalize" }]}>{professionText}</Text>
            <Text style={[type.caption, { color: theme.textMuted, textAlign: "center" }]}>{t("account.memberSince", "Member since")} {fmtDate(p.created_at)}</Text>
          </Card>
        </FadeInView>

        {/* Account information */}
        <FadeInView index={1}>
          <Card style={{ gap: 0 }}>
            <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left", marginBottom: 6 }]}>{t("account.accountInformation", "Account Information")}</Text>
            <InfoRow label={t("account.email", "Email")} value={p.user_details?.email || p.email || t("account.notProvided", "Not provided")} styles={styles} theme={theme} type={type} isRTL={isRTL} first />
            <InfoRow label={t("account.phoneNumber", "Phone Number")} value={p.phone_number || t("account.notProvided", "Not provided")} styles={styles} theme={theme} type={type} isRTL={isRTL} />
            <InfoRow label={t("account.passportNumber", "Passport Number")} value={p.passport_number || t("account.notProvided", "Not provided")} styles={styles} theme={theme} type={type} isRTL={isRTL} />
            <InfoRow label={t("account.nationality", "Nationality")} value={nationalityLabel(p.nationality)} styles={styles} theme={theme} type={type} isRTL={isRTL} />
            <InfoRow label={t("account.address", "Address")} value={p.address || t("account.notProvided", "Not provided")} styles={styles} theme={theme} type={type} isRTL={isRTL} />
            <InfoRow label={t("account.profession", "Profession")} value={professionText} styles={styles} theme={theme} type={type} isRTL={isRTL} capitalize />
            <InfoRow label={t("account.lastUpdated", "Last Updated")} value={fmtDate(p.updated_at)} styles={styles} theme={theme} type={type} isRTL={isRTL} />
          </Card>
        </FadeInView>

        {/* Document verification status */}
        {vs ? (
          <FadeInView index={2}>
            <Card style={{ gap: 12 }}>
              <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>{t("account.documentVerificationStatus", "Document Verification Status")}</Text>
              <View style={styles.statusRow}>
                <Ionicons name={vs.icon} size={20} color={theme[vs.color]} />
                <Text style={[type.body, { color: theme.text, fontWeight: "700" }]}>{t(vs.titleKey, vs.titleDefault)}</Text>
              </View>
              <Text style={[type.caption, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>{vsMessage()}</Text>
              <View style={styles.statusRow}>
                <Ionicons name={ds.has_passport ? "checkmark-circle" : "alert-circle"} size={16} color={ds.has_passport ? theme.positive : theme.error} />
                <Text style={[type.caption, { color: theme.textSecondary }]}>
                  {t("account.passportDocument", "Passport Document")}: {ds.has_passport ? t("account.submitted", "Submitted") : t("account.notSubmitted", "Not submitted")}
                </Text>
              </View>
            </Card>
          </FadeInView>
        ) : null}

        {error ? <Banner type="error" message={error} /> : null}

        {/* Actions */}
        <FadeInView index={3} style={{ gap: 10 }}>
          <AppButton title={t("account.editProfile", "Edit Profile")} icon="create-outline" onPress={() => router.push("/edit-profile")} />
          <AppButton title={t("account.changePassword", "Change Password")} icon="lock-closed-outline" variant="secondary" onPress={() => router.push("/change-password")} />
        </FadeInView>
      </ScrollView>
    </Screen>
  );
}

function InfoRow({ label, value, styles, theme, type, isRTL, first, capitalize }) {
  return (
    <View style={[styles.infoRow, first && { borderTopWidth: 0 }]}>
      <Text style={[type.caption, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[type.body, { color: theme.text, flexShrink: 1, textAlign: isRTL ? "left" : "right", textTransform: capitalize ? "capitalize" : "none" }]} numberOfLines={2} selectable>{value}</Text>
    </View>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    header: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 8 },
    headerBack: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
    avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center" },
    statusRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 },
    infoRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 11,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
  });
