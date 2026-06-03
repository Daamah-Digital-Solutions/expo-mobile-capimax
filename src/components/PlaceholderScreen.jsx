// Phase-1 placeholder body for empty tabs/screens. Real content arrives in later phases.
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "./Screen";
import colors from "../theme/colors";

export default function PlaceholderScreen({ title, icon = "construct-outline", note }) {
  return (
    <Screen>
      <View style={styles.center}>
        <Ionicons name={icon} size={48} color={colors.primaryLight} />
        <Text style={styles.title}>{title}</Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 10 },
  title: { color: colors.text, fontSize: 22, fontWeight: "700", textAlign: "center" },
  note: { color: colors.textSecondary, fontSize: 14, textAlign: "center" },
});
