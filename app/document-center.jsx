// Document Center (Phase 9) — GET /api/documents/ → results[] { id, name, created_at,
// document_url }; list with open-externally action (web uses target=_blank, no auth on
// document_url). Zero mock; skeleton / empty / error; pull-to-refresh; both modes + RTL.
//
// NOTE: the web page also lists signed contracts with an auth-protected PDF *blob* download
// (/api/contracts/{id}/download/). That needs file-system + sharing (not in the current deps)
// and is out of the user's explicit document-center scope → deferred (see STATE / report).
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../src/components/Screen";
import Card from "../src/components/Card";
import Banner from "../src/components/Banner";
import AppButton from "../src/components/AppButton";
import Skeleton from "../src/components/Skeleton";
import EmptyState from "../src/components/EmptyState";
import FadeInView from "../src/components/motion/FadeInView";
import { useTheme } from "../src/context/ThemeContext";
import { useLanguage } from "../src/context/LanguageContext";
import { documentService } from "../src/api/services";

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDocs = useCallback(async () => {
    setError("");
    try {
      const res = await documentService.getDocuments();
      setDocs(res?.data?.results || []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t("documentCenter.error", "Failed to load documents. Please try again later."));
      throw err;
    }
  }, [t]);

  useEffect(() => {
    setLoading(true);
    fetchDocs().catch(() => {}).finally(() => setLoading(false));
  }, [fetchDocs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocs().catch(() => {}).finally(() => setRefreshing(false));
  };

  const open = async (url) => {
    if (!url) return;
    try { await WebBrowser.openBrowserAsync(url); } catch {}
  };

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
          <Skeleton width="100%" height={88} radius={radii.card} />
          <Skeleton width="100%" height={88} radius={radii.card} />
          <Skeleton width="100%" height={88} radius={radii.card} />
        </View>
      </Screen>
    );
  }

  if (error && !docs.length) {
    return (
      <Screen edges={["bottom"]}>
        {Header}
        <View style={{ padding: spacing.xl, gap: 16 }}>
          <Banner type="error" message={error} actionLabel={t("common.retry", "Retry")} onAction={() => { setLoading(true); fetchDocs().catch(() => {}).finally(() => setLoading(false)); }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["bottom"]}>
      {Header}
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40, gap: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}
      >
        <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{t("documentCenter.subtitle", "Access and manage all your important documents in one secure location")}</Text>

        {docs.length ? (
          docs.map((doc, i) => (
            <FadeInView key={doc.id ?? i} index={Math.min(i, 8)}>
              <Card style={{ gap: 12 }}>
                <View style={styles.docHead}>
                  <View style={styles.docIcon}><Ionicons name="document-text" size={20} color={theme.primary} /></View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>{doc.name}</Text>
                    <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{fmtDate(doc.created_at)}</Text>
                  </View>
                </View>
                <AppButton title={t("documentCenter.open", "Open Document")} icon="open-outline" variant="secondary" disabled={!doc.document_url} onPress={() => open(doc.document_url)} />
              </Card>
            </FadeInView>
          ))
        ) : (
          <EmptyState
            icon="folder-open-outline"
            title={t("documentCenter.noDocuments", "No Documents Available")}
            message={t("documentCenter.noDocumentsDescription", "Your documents will appear here once they are added to your account")}
          />
        )}
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
  });
