// StatTile (DESIGN.md §7) — label (caption, muted) over a big number (statNumber).
// Optional delta pill. Designed for a 2-up grid.
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Card from "./Card";
import ReturnPill from "./ReturnPill";
import { useTheme } from "../context/ThemeContext";

export default function StatTile({ label, value, delta, style }) {
  const { theme, type } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Card style={[styles.tile, style]} padded>
      <Text style={[type.caption, styles.label]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[type.statNumber, styles.value]} numberOfLines={1}>
        {value}
      </Text>
      {delta != null ? <ReturnPill value={delta} style={styles.delta} /> : null}
    </Card>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    tile: { flex: 1, gap: 4 },
    label: { color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
    value: { color: theme.text },
    delta: { alignSelf: "flex-start", marginTop: 4 },
  });
