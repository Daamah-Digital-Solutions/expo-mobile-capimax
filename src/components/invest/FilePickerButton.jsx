// Transfer-proof picker for the manual payment methods (bank / crypto / NovaPay).
// Mirrors the web's <input type="file" accept=".pdf,.jpg,.jpeg,.png"> with the same
// 5MB cap, and hands back the RN multipart file shape { uri, name, type }.
import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];
const MAX_BYTES = 5 * 1024 * 1024;

export default function FilePickerButton({ file, onPick, onError }) {
  const { t } = useTranslation();
  const { theme, radii, type } = useTheme();
  const { isRTL } = useLanguage();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const pick = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ALLOWED,
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset) return;
      if (asset.mimeType && !ALLOWED.includes(asset.mimeType)) {
        onError?.(t("payment.invalidFileType", "Invalid file type. Please upload PDF, JPEG, or PNG files."));
        return;
      }
      if (asset.size && asset.size > MAX_BYTES) {
        onError?.(t("payment.fileSizeExceeded", "File size should not exceed 5MB"));
        return;
      }
      onPick({
        uri: asset.uri,
        name: asset.name || "proof",
        type: asset.mimeType || "application/octet-stream",
      });
    } catch (e) {
      onError?.(t("payment.uploadError", "Failed to upload transfer proof"));
    }
  };

  return (
    <Pressable onPress={pick} style={styles.box} hitSlop={4}>
      <Ionicons name={file ? "checkmark-circle" : "cloud-upload-outline"} size={22} color={file ? theme.positive : theme.primary} />
      <Text style={[type.label, { color: file ? theme.text : theme.primaryDark, flexShrink: 1, textAlign: "center" }]} numberOfLines={1}>
        {file ? file.name : t("payment.uploadTransferProof", "Upload Transfer Proof")}
      </Text>
    </Pressable>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    box: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      minHeight: 64,
      paddingHorizontal: 16,
      borderRadius: radii.input,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: theme.primary,
      backgroundColor: theme.surfaceAlt,
    },
  });
