// Lightweight multi-series line/area chart built on react-native-svg (already a dep;
// Expo-Go + New-Architecture safe — no native chart lib). Replaces the web's ApexCharts.
// Charts are intentionally LTR (time flows left→right) regardless of language.
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Polyline, Line, Circle, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { useTheme } from "../../context/ThemeContext";

const PAD = { left: 46, right: 14, top: 12, bottom: 22 };

export default function PerformanceChart({ labels = [], series = [], height = 220, formatY = (n) => `${Math.round(n)}`, showArea = true }) {
  const { theme, type } = useTheme();
  const [w, setW] = useState(0);

  const model = useMemo(() => {
    const clean = series.map((s) => ({ ...s, values: (s.values || []).map((v) => Number(v) || 0) }));
    const all = clean.flatMap((s) => s.values);
    let min = all.length ? Math.min(...all) : 0;
    let max = all.length ? Math.max(...all) : 1;
    if (min === max) { max = min + 1; min = min - 1; }
    // small headroom
    const pad = (max - min) * 0.08;
    min -= pad; max += pad;
    return { clean, min, max };
  }, [series]);

  const n = labels.length;
  const innerW = Math.max(0, w - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (n <= 1 ? innerW / 2 : (i * innerW) / (n - 1));
  const y = (v) => PAD.top + innerH * (1 - (v - model.min) / (model.max - model.min || 1));

  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((f) => model.min + f * (model.max - model.min));

  // x-axis: show ~3 labels (first / mid / last) to avoid crowding
  const xIdx = n <= 1 ? [0] : [0, Math.floor((n - 1) / 2), n - 1];

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && n > 0 ? (
        <Svg width={w} height={height}>
          <Defs>
            {model.clean.map((s, si) => (
              <LinearGradient key={si} id={`grad${si}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={s.color} stopOpacity="0.28" />
                <Stop offset="1" stopColor={s.color} stopOpacity="0" />
              </LinearGradient>
            ))}
          </Defs>

          {/* gridlines + y labels */}
          {gridYs.map((gv, i) => {
            const gy = y(gv);
            return (
              <React.Fragment key={i}>
                <Line x1={PAD.left} y1={gy} x2={w - PAD.right} y2={gy} stroke={theme.border} strokeWidth={1} />
                <SvgText x={PAD.left - 6} y={gy + 3} fill={theme.textMuted} fontSize="9" textAnchor="end">{formatY(gv)}</SvgText>
              </React.Fragment>
            );
          })}

          {/* area under the first series */}
          {showArea && model.clean[0] ? (
            <Path
              d={`M ${x(0)} ${y(model.clean[0].values[0] ?? model.min)} ` +
                model.clean[0].values.map((v, i) => `L ${x(i)} ${y(v)}`).join(" ") +
                ` L ${x(n - 1)} ${PAD.top + innerH} L ${x(0)} ${PAD.top + innerH} Z`}
              fill={`url(#grad0)`}
            />
          ) : null}

          {/* series polylines + end dots */}
          {model.clean.map((s, si) => (
            <React.Fragment key={si}>
              <Polyline
                points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {n > 0 ? <Circle cx={x(n - 1)} cy={y(s.values[n - 1] ?? model.min)} r={3} fill={s.color} /> : null}
            </React.Fragment>
          ))}

          {/* x labels */}
          {xIdx.map((i) => (
            <SvgText key={i} x={x(i)} y={height - 6} fill={theme.textMuted} fontSize="9" textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>
              {labels[i]}
            </SvgText>
          ))}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}

      {/* legend */}
      {series.length ? (
        <View style={styles.legend}>
          {series.map((s, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <Text style={[type.caption, { color: theme.textSecondary }]} numberOfLines={1}>{s.key}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 8, justifyContent: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 9, height: 9, borderRadius: 5 },
});
