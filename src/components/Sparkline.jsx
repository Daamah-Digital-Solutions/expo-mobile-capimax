// Sparkline — a tiny axis-less line+area chart on react-native-svg (same engine as
// PerformanceChart, shrunk). Sizes to its container width. Intentionally LTR (time flows L→R).
import React, { useId, useMemo, useState } from "react";
import { View } from "react-native";
import Svg, { Path, Polyline, Defs, LinearGradient, Stop } from "react-native-svg";
import { useTheme } from "../context/ThemeContext";

export default function Sparkline({ values = [], color, height = 48, area = true, strokeWidth = 2 }) {
  const { theme } = useTheme();
  const [w, setW] = useState(0);
  const gid = "sp" + useId().replace(/[^a-zA-Z0-9]/g, ""); // unique, SVG-safe id

  const stroke = color || theme.primary;
  const data = useMemo(() => (values || []).map((v) => Number(v) || 0), [values]);
  const n = data.length;

  const min = n ? Math.min(...data) : 0;
  const max = n ? Math.max(...data) : 1;
  const range = max - min || 1;
  const pad = 3;
  const innerH = height - pad * 2;
  const x = (i) => (n <= 1 ? w / 2 : (i * w) / (n - 1));
  const y = (v) => pad + innerH * (1 - (v - min) / range);

  const points = data.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const areaPath = n
    ? `M ${x(0)} ${y(data[0])} ` + data.map((v, i) => `L ${x(i)} ${y(v)}`).join(" ") + ` L ${x(n - 1)} ${height} L ${x(0)} ${height} Z`
    : "";

  return (
    <View style={{ height }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && n > 1 ? (
        <Svg width={w} height={height}>
          <Defs>
            <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={stroke} stopOpacity="0.25" />
              <Stop offset="1" stopColor={stroke} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {area ? <Path d={areaPath} fill={`url(#${gid})`} /> : null}
          <Polyline points={points} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
        </Svg>
      ) : null}
    </View>
  );
}
