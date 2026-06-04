// NOWPayments hosted checkout in a WebView. The route owns the create-invoice call
// and the status polling (every 5s, 30-min cap, matching the web); this component just
// renders the hosted_url and shows live polling status. LIVE crypto payments.
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

export default function NowPaymentsWebView({ url, statusText, onClose, onNavChange }) {
  const { theme, type } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.fill, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="logo-bitcoin" size={18} color={theme.primary} />
          <Text style={[type.label, { color: theme.text }]}>NOWPayments</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={10} style={styles.close}>
          <Ionicons name="close" size={22} color={theme.text} />
        </Pressable>
      </View>

      {statusText ? (
        <View style={styles.statusBar}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[type.caption, { color: theme.textSecondary }]}>{statusText}</Text>
        </View>
      ) : null}

      <WebView
        originWhitelist={["*"]}
        source={{ uri: url }}
        onNavigationStateChange={(s) => onNavChange?.(s?.url || "")}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.primary} />
          </View>
        )}
      />
    </View>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    fill: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.bg, zIndex: 50 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    close: { padding: 4 },
    statusBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.surfaceAlt,
    },
    loading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  });
