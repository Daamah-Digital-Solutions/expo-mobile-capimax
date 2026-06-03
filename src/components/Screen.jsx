// Base screen wrapper: themed background + safe-area insets. Shared by all screens.
import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

export default function Screen({ children, style, edges = ["top", "bottom"] }) {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={edges}>
      <View style={[styles.body, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1 },
});
