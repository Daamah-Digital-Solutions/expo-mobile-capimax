import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../../src/components/Screen";
import Card from "../../src/components/Card";
import Banner from "../../src/components/Banner";
import Skeleton from "../../src/components/Skeleton";
import EmptyState from "../../src/components/EmptyState";
import SegmentedControl from "../../src/components/SegmentedControl";
import AnimatedNumber from "../../src/components/motion/AnimatedNumber";
import FadeInView from "../../src/components/motion/FadeInView";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { walletService } from "../../src/api/services";

// Money fields arrive as STRINGS (balance/profit_balance) or numbers (total_balance) → parseFloat.
const USD = (v) => `$${(parseFloat(v) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return String(iso);
  }
}

export default function WalletTab() {
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const [wallet, setWallet] = useState(null); // merged: {...results[0], ...summary}
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("transactions"); // transactions | withdrawals

  // Mirrors the web fetchWalletData: base wallet (results[0]) merged with summary,
  // plus transactions + withdrawals (each falling back to []).
  const fetchAll = useCallback(async () => {
    setError("");
    try {
      const baseRes = await walletService.getWallet();
      const base = baseRes?.data?.results?.[0] || {};
      const [summaryRes, txRes, wdRes] = await Promise.all([
        walletService.getSummary(),
        walletService.getTransactions(),
        walletService.getWithdrawals(),
      ]);
      setWallet({ ...base, ...(summaryRes?.data || {}) });
      setTransactions(txRes?.data?.results || []);
      setWithdrawals(wdRes?.data?.results || []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t("wallet.loadError", "Failed to load wallet data"));
      throw err;
    }
  }, [t]);

  useEffect(() => {
    setLoading(true);
    fetchAll().catch(() => {}).finally(() => setLoading(false));
  }, [fetchAll]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll().catch(() => {}).finally(() => setRefreshing(false));
  };

  const header = (
    <View style={styles.titleRow}>
      <View style={{ gap: 2 }}>
        <Text style={[type.h1, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>{t("wallet.title", "Wallet")}</Text>
        <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{t("wallet.subtitle", "Manage your funds")}</Text>
      </View>
      <Ionicons name="wallet-outline" size={24} color={theme.primary} />
    </View>
  );

  if (loading) {
    return (
      <Screen edges={["top"]}>
        <View style={{ padding: spacing.xl, gap: 14 }}>
          {header}
          <Skeleton width="100%" height={120} radius={radii.card} />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Skeleton width="48%" height={84} radius={radii.card} />
            <Skeleton width="48%" height={84} radius={radii.card} />
          </View>
          <Skeleton width="100%" height={44} radius={radii.pill} />
          <Skeleton width="100%" height={64} radius={radii.card} />
          <Skeleton width="100%" height={64} radius={radii.card} />
        </View>
      </Screen>
    );
  }

  if (error && !wallet) {
    return (
      <Screen edges={["top"]}>
        <View style={{ padding: spacing.xl, gap: 16 }}>
          {header}
          <Banner type="error" message={error} actionLabel={t("common.retry", "Retry")} onAction={() => { setLoading(true); fetchAll().catch(() => {}).finally(() => setLoading(false)); }} />
        </View>
      </Screen>
    );
  }

  const lastProfit = wallet?.last_profit_date ? fmtDate(wallet.last_profit_date) : t("wallet.noProfitsYet", "No profits yet");

  return (
    <Screen edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}
      >
        {header}

        {/* Total balance hero */}
        <FadeInView index={0}>
          <Card style={{ gap: 6 }}>
            <Text style={[type.caption, styles.heroLabel]}>{t("wallet.totalBalance", "Total Balance")}</Text>
            <AnimatedNumber value={parseFloat(wallet?.total_balance) || 0} format={USD} style={[type.display, { color: theme.text }]} />
            <View style={styles.lastRow}>
              <Ionicons name="time-outline" size={13} color={theme.textMuted} />
              <Text style={[type.caption, { color: theme.textMuted }]}>{t("wallet.lastUpdated", "Last Updated")}: {lastProfit}</Text>
            </View>
          </Card>
        </FadeInView>

        {/* Main + profit balances */}
        <FadeInView index={1} style={styles.tilesRow}>
          <BalanceTile label={t("wallet.mainBalance", "Main Balance")} value={wallet?.balance} theme={theme} type={type} isRTL={isRTL} />
          <BalanceTile label={t("wallet.profitBalance", "Profit Balance")} value={wallet?.profit_balance} theme={theme} type={type} isRTL={isRTL} accent />
        </FadeInView>

        {/* Tabs */}
        <FadeInView index={2}>
          <SegmentedControl
            segments={[
              { label: t("wallet.transactions", "Transactions"), value: "transactions" },
              { label: t("wallet.withdrawals", "Withdrawals"), value: "withdrawals" },
            ]}
            value={tab}
            onChange={setTab}
          />
        </FadeInView>

        {error ? <Banner type="error" message={error} /> : null}

        {tab === "transactions" ? (
          transactions.length ? (
            <View style={{ gap: 10 }}>
              {transactions.map((tx, i) => (
                <FadeInView key={tx.id ?? i} index={Math.min(i, 6)}>
                  <Card style={styles.rowCard}>
                    <View style={styles.rowMain}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>
                          {tx.type || t("wallet.type", "Type")}
                        </Text>
                        <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{fmtDate(tx.created_at)}</Text>
                      </View>
                      <Text style={[type.label, { color: theme.text }]}>{USD(tx.amount)}</Text>
                    </View>
                    {tx.description ? (
                      <Text style={[type.caption, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>{tx.description}</Text>
                    ) : null}
                  </Card>
                </FadeInView>
              ))}
            </View>
          ) : (
            <EmptyState icon="receipt-outline" title={t("wallet.noTransactions", "No transactions yet")} />
          )
        ) : withdrawals.length ? (
          <View style={{ gap: 10 }}>
            {withdrawals.map((wd, i) => (
              <FadeInView key={wd.id ?? i} index={Math.min(i, 6)}>
                <Card style={styles.rowCard}>
                  <View style={styles.rowMain}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>{USD(wd.amount)}</Text>
                      <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{fmtDate(wd.created_at)}</Text>
                    </View>
                    <StatusPill status={wd.status} theme={theme} type={type} t={t} />
                  </View>
                  {wd.bank_name ? (
                    <Text style={[type.caption, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>
                      {t("wallet.bankInfo", "Bank Info")}: {wd.bank_name}
                    </Text>
                  ) : null}
                </Card>
              </FadeInView>
            ))}
          </View>
        ) : (
          <EmptyState icon="cash-outline" title={t("wallet.noWithdrawals", "No withdrawals yet")} />
        )}
      </ScrollView>
    </Screen>
  );
}

function BalanceTile({ label, value, theme, type, isRTL, accent }) {
  return (
    <Card style={{ flex: 1, gap: 4 }}>
      <Text style={[type.caption, { color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>
        {label}
      </Text>
      <AnimatedNumber
        value={parseFloat(value) || 0}
        format={USD}
        style={[type.statNumber, { color: accent ? theme.positive : theme.text, textAlign: isRTL ? "right" : "left" }]}
      />
    </Card>
  );
}

const STATUS_TONE = { pending: "warning", completed: "positive", failed: "error", processing: "info" };

function StatusPill({ status, theme, type, t }) {
  const key = String(status || "").toLowerCase();
  const tone = STATUS_TONE[key] || "neutral";
  const color = tone === "warning" ? theme.warning : tone === "positive" ? theme.positive : tone === "error" ? theme.error : tone === "info" ? theme.info : theme.textSecondary;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: color + "22" }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text style={[type.micro, { color }]}>{t(`wallet.status_${key}`, status || "—")}</Text>
    </View>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    titleRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    heroLabel: { color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5, textAlign: isRTL ? "right" : "left" },
    lastRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 5, marginTop: 2 },
    tilesRow: { flexDirection: isRTL ? "row-reverse" : "row", gap: 12 },
    rowCard: { gap: 8 },
    rowMain: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  });
