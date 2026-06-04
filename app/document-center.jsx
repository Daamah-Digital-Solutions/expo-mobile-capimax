// Document Center (Phase 9 → Phase 10 with real downloads), mirroring web pages/document-center.
//   • Signed contracts: GET /api/contracts/user-contracts/ → contracts[] filtered status==='signed'
//     (§4.7). Download = GET /api/contracts/{id}/download/ WITH Bearer auth → save to cache →
//     OS share/save sheet. Handles 401(expired)/404(not found)/400(must be signed).
//   • Documents: GET /api/documents/ → results[] { id, name, created_at, document_url }. Download
//     = direct file → cache + share; Google-Drive viewer link → open externally (auto fallback).
// Zero mock; skeleton / empty / error; per-item busy state; both modes + RTL.
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
import EmptyState from "../src/components/EmptyState";
import SectionHeader from "../src/components/SectionHeader";
import FadeInView from "../src/components/motion/FadeInView";
import { useTheme } from "../src/context/ThemeContext";
import { useLanguage } from "../src/context/LanguageContext";
import { documentService, contractService } from "../src/api/services";
import { downloadAuthedAndShare, downloadUrlAndShare } from "../src/utils/fileDownload";

const USD = (v) => `$${(parseFloat(v) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
function fmtDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); } catch { return String(iso); }
}

export default function DocumentCenterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const [docs, setDocs] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [actionMsg, setActionMsg] = useState(null); // { type, text }

  const fetchAll = useCallback(async () => {
    setError("");
    // Documents are the primary content; contracts are best-effort (don't block on failure).
    const [dRes, cRes] = await Promise.allSettled([
      documentService.getDocuments(),
      contractService.userContracts(),
    ]);
    if (dRes.status === "fulfilled") {
      setDocs(dRes.value?.data?.results || []);
    } else {
      setError(dRes.reason?.response?.data?.message || dRes.reason?.message || t("documentCenter.error", "Failed to load documents. Please try again later."));
      throw dRes.reason;
    }
    setContracts(cRes.status === "fulfilled" ? (cRes.value?.data?.contracts || []).filter((c) => c.status === "signed") : []);
  }, [t]);

  useEffect(() => {
    setLoading(true);
    fetchAll().catch(() => {}).finally(() => setLoading(false));
  }, [fetchAll]);

  const onRefresh = () => {
    setRefreshing(true);
    setActionMsg(null);
    fetchAll().catch(() => {}).finally(() => setRefreshing(false));
  };

  const mapErr = (e) => {
    switch (e?.code) {
      case "expired": return t("documentCenter.errExpired", "Your session expired. Please sign in again.");
      case "notfound": return t("documentCenter.errNotFound", "Document not found.");
      case "notsigned": return t("documentCenter.errNotSigned", "The contract must be signed before downloading.");
      case "noshare": return t("documentCenter.errNoShare", "Sharing is not available on this device.");
      default: return t("documentCenter.errFailed", "Download failed. Please try again.");
    }
  };

  const run = async (key, fn) => {
    setBusyId(key);
    setActionMsg(null);
    try {
      const r = await fn();
      setActionMsg({ type: "success", text: r?.mode === "opened" ? t("documentCenter.openedExternally", "Opened in your browser.") : t("documentCenter.downloadReady", "Ready — choose where to save or share it.") });
    } catch (e) {
      setActionMsg({ type: "error", text: mapErr(e) });
    } finally {
      setBusyId(null);
    }
  };

  const downloadContract = (c) =>
    run(`c-${c.contract_id}`, () => downloadAuthedAndShare({
      path: `/api/contracts/${c.contract_id}/download/`,
      fileName: `Investment_Contract_${c.contract_id}`,
      mimeType: "application/pdf",
    }));

  const downloadDoc = (d) =>
    run(`d-${d.id}`, () => downloadUrlAndShare({ url: d.document_url, fileName: d.name }));

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <Pressable style={styles.headerBack} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color={theme.text} />
      </Pressable>
      <Text style={[type.label, { color: theme.text }]}>{t("documentCenter.title", "Document Center")}</Text>
      <View style={styles.headerBack} />
    </View>
  );

  if (loading) {
    return (
      <Screen edges={["bottom"]}>
        {Header}
        <View style={{ padding: spacing.xl, gap: 14 }}>
          <Skeleton width="100%" height={120} radius={radii.card} />
          <Skeleton width="100%" height={120} radius={radii.card} />
          <Skeleton width="100%" height={88} radius={radii.card} />
        </View>
      </Screen>
    );
  }

  if (error && !docs.length && !contracts.length) {
    return (
      <Screen edges={["bottom"]}>
        {Header}
        <View style={{ padding: spacing.xl, gap: 16 }}>
          <Banner type="error" message={error} actionLabel={t("common.retry", "Retry")} onAction={() => { setLoading(true); fetchAll().catch(() => {}).finally(() => setLoading(false)); }} />
        </View>
      </Screen>
    );
  }

  const empty = !docs.length && !contracts.length;

  return (
    <Screen edges={["bottom"]}>
      {Header}
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40, gap: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}
      >
        <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{t("documentCenter.subtitle", "Access and manage all your important documents in one secure location")}</Text>

        {actionMsg ? <Banner type={actionMsg.type} message={actionMsg.text} /> : null}

        {empty ? (
          <EmptyState
            icon="folder-open-outline"
            title={t("documentCenter.noDocuments", "No Documents Available")}
            message={t("documentCenter.noDocumentsDescription", "Your documents will appear here once they are added to your account")}
          />
        ) : null}

        {/* Signed contracts */}
        {contracts.length ? (
          <View style={{ gap: 10 }}>
            <SectionHeader title={t("documentCenter.signedContracts", "Signed Contracts")} />
            {contracts.map((c, i) => {
              const key = `c-${c.contract_id}`;
              return (
                <FadeInView key={key} index={Math.min(i, 6)}>
                  <Card style={{ gap: 12 }}>
                    <View style={styles.docHead}>
                      <View style={[styles.docIcon, { backgroundColor: theme.positive + "22" }]}>
                        <Ionicons name="document-text" size={20} color={theme.positive} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>
                          {c.title || `${c.contract_type || ""} ${t("documentCenter.contract", "Contract")}`.trim()}
                        </Text>
                        <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>
                          {USD(c.total_amount)}{c.contract_type ? ` · ${c.contract_type}` : ""}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.datesRow}>
                      <Text style={[type.micro, { color: theme.textMuted }]}>{t("documentCenter.created", "Created")}: {fmtDate(c.created_at)}</Text>
                      <Text style={[type.micro, { color: theme.positive }]}>{t("documentCenter.signed", "Signed")}: {fmtDate(c.signed_at)}</Text>
                    </View>
                    <AppButton title={t("documentCenter.downloadPdf", "Download PDF")} icon="download-outline" loading={busyId === key} disabled={!!busyId && busyId !== key} onPress={() => downloadContract(c)} />
                  </Card>
                </FadeInView>
              );
            })}
          </View>
        ) : null}

        {/* Documents */}
        {docs.length ? (
          <View style={{ gap: 10 }}>
            <SectionHeader title={t("documentCenter.documents", "Documents")} />
            {docs.map((d, i) => {
              const key = `d-${d.id}`;
              return (
                <FadeInView key={key} index={Math.min(i, 6)}>
                  <Card style={{ gap: 12 }}>
                    <View style={styles.docHead}>
                      <View style={styles.docIcon}><Ionicons name="document-text" size={20} color={theme.primary} /></View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>{d.name}</Text>
                        <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{fmtDate(d.created_at)}</Text>
                      </View>
                    </View>
                    <AppButton title={t("documentCenter.download", "Download")} icon="download-outline" variant="secondary" loading={busyId === key} disabled={!d.document_url || (!!busyId && busyId !== key)} onPress={() => downloadDoc(d)} />
                  </Card>
                </FadeInView>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    header: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 8 },
    headerBack: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
    docHead: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 },
    docIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.primary + "22", alignItems: "center", justifyContent: "center" },
    datesRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  });
