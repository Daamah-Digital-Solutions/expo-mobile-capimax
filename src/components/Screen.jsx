// Base screen wrapper: dark background + safe-area insets. Shared by all screens.
import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../theme/colors";

export default function Screen({ children, style, edges = ["top", "bottom"] }) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <View style={[styles.body, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
});
