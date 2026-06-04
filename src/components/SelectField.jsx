// SelectField — labelled dropdown matching the Field look (height 52, radius 14). Tapping
// opens a bottom-anchored modal with an optional search box + scrollable option list
// (used for nationality = 240 countries, and profession = 4 options). RTL-aware, themed.
import React, { useMemo, useState } from "react";
import { View, Text, Pressable, Modal, TextInput, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

// options: [{ value, label }]
export default function SelectField({ label, value, options, onChange, placeholder, searchable = false, error, disabled = false }) {
  const { t } = useTranslation();
  const { theme, radii, type } = useTheme();
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);
  const borderColor = error ? theme.negative : theme.border;

  const filtered = searchable && query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const close = () => { setOpen(false); setQuery(""); };
  const choose = (v) => { onChange(v); close(); };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[type.label, styles.label]}>{label}</Text> : null}
      <Pressable
        style={[styles.box, { borderColor, borderWidth: error ? 1.5 : StyleSheet.hairlineWidth }, disabled && styles.disabled]}
        onPress={disabled ? undefined : () => setOpen(true)}
      >
        <Text style={[type.body, { color: selected ? theme.text : theme.textMuted, flex: 1, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>
          {selected ? selected.label : placeholder || t("common.select", "Select")}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
      </Pressable>
      {error ? <Text style={[type.caption, styles.error]}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHead}>
            <Text style={[type.h2, { color: theme.text }]}>{label || t("common.select", "Select")}</Text>
            <Pressable onPress={close} hitSlop={10}><Ionicons name="close" size={22} color={theme.text} /></Pressable>
          </View>

          {searchable ? (
            <View style={styles.searchRow}>
              <Ionicons name="search" size={18} color={theme.textMuted} />
              <TextInput
                style={[type.body, styles.search]}
                value={query}
                onChangeText={setQuery}
                placeholder={t("common.search", "Search")}
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ) : null}

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.value)}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 360 }}
            renderItem={({ item }) => {
              const active = item.value === value;
              return (
                <Pressable style={styles.option} onPress={() => choose(item.value)}>
                  <Text style={[type.body, { color: active ? theme.primaryDark : theme.text, flex: 1, textAlign: isRTL ? "right" : "left", fontWeight: active ? "700" : "400" }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {active ? <Ionicons name="checkmark" size={18} color={theme.primary} /> : null}
                </Pressable>
              );
            }}
            ListEmptyComponent={<Text style={[type.body, { color: theme.textMuted, textAlign: "center", padding: 20 }]}>{t("common.noResults", "No results")}</Text>}
          />
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    wrap: { gap: 6 },
    label: { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" },
    box: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.surfaceAlt,
      borderRadius: radii.input,
      paddingHorizontal: 14,
      height: 52,
    },
    disabled: { opacity: 0.6 },
    error: { color: theme.negative, textAlign: isRTL ? "right" : "left" },

    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
    sheet: {
      position: "absolute", left: 0, right: 0, bottom: 0,
      backgroundColor: theme.surface,
      borderTopLeftRadius: radii.sheet,
      borderTopRightRadius: radii.sheet,
      paddingHorizontal: 20,
      paddingTop: 12,
      gap: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: theme.borderStrong, marginBottom: 4 },
    sheetHead: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" },
    searchRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.surfaceAlt,
      borderRadius: radii.input,
      paddingHorizontal: 14,
      height: 48,
    },
    search: { flex: 1, color: theme.text, textAlign: isRTL ? "right" : "left", height: "100%" },
    option: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
  });
