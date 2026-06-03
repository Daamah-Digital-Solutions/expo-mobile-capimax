import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import colors, { gradients, radius } from "../src/theme/colors";

// Temporary Phase-0 landing screen. No real screen is built yet (per BUILD_PLAN Phase 0).
export default function HelloCapiMax() {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? "(not configured)";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>CapiMax</Text>
        </View>

        <Text style={styles.title}>Hello CapiMax</Text>
        <Text style={styles.subtitle}>Mobile app scaffold — Phase 0</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Backend</Text>
          <Text style={styles.cardValue}>{apiUrl}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  badge: {
    backgroundColor: gradients.brand[0],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    marginBottom: 8,
  },
  badgeText: {
    color: colors.text,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  card: {
    marginTop: 20,
    width: "100%",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 16,
    gap: 4,
  },
  cardLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardValue: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: "600",
  },
});
