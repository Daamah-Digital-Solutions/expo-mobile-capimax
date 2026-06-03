// Card (DESIGN.md §7/§3) — surface, radius 20, mode-correct elevation:
// light = soft shadow, dark = surface + hairline border. `pressable` adds press-scale.
import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import PressableScale from "./motion/PressableScale";
import { useTheme } from "../context/ThemeContext";

export default function Card({ children, style, pressable = false, onPress, level = "card", padded = true, noBorderLight = false }) {
  const { theme, radii, elevation } = useTheme();
  const styles = useMemo(() => makeStyles(theme, radii), [theme, radii]);

  const base = [
    styles.card,
    padded && styles.padded,
    elevation(level),
    // In light mode a hairline border is optional; keep it subtle for definition.
    !noBorderLight && { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
    style,
  ];

  if (pressable) {
    return (
      <PressableScale onPress={onPress} style={base}>
        {children}
      </PressableScale>
    );
  }
  return <View style={base}>{children}</View>;
}

const makeStyles = (theme, radii) =>
  StyleSheet.create({
    card: { backgroundColor: theme.card, borderRadius: radii.card, overflow: "hidden" },
    padded: { padding: 16 },
  });
