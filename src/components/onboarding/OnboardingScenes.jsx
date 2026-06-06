// Onboarding illustrations — large, custom react-native-svg "scenes", one concept per slide, all
// at the same quality bar: brand green over the themed background, a soft ambient green glow, and a
// staggered reanimated entrance driven by the slide's `active` flag. EVERY element renders real
// content (icon/text) — no empty nodes. Reduce-motion → final state instantly.
import React, { useEffect, useId } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Defs, RadialGradient, Stop, Line } from "react-native-svg";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";

const GREEN = "#2ead6f";
const GREEN_LT = "#54c98a";
const rad = (deg) => (deg * Math.PI) / 180;

// Soft ambient radial glow behind a scene (unique gradient id per instance).
function Glow({ size }) {
  const gid = "g" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id={gid} cx="50%" cy="50%" r="55%">
          <Stop offset="0%" stopColor={GREEN} stopOpacity="0.20" />
          <Stop offset="55%" stopColor={GREEN} stopOpacity="0.06" />
          <Stop offset="100%" stopColor={GREEN} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gid})`} />
    </Svg>
  );
}

const s = StyleSheet.create({
  center: { position: "absolute", alignItems: "center", justifyContent: "center", borderWidth: 1 },
  pod: { position: "absolute", alignItems: "center", justifyContent: "center", borderWidth: 1 },
  badge: { position: "absolute", alignItems: "center", justifyContent: "center", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: GREEN, borderWidth: 0 },
  badgeText: { color: "#0b2928", fontWeight: "800" },
  coinText: { color: GREEN_LT, fontWeight: "800" },
});

// Render the inner content of a medallion/pod: an Ionicon, or short text (e.g. a coin label).
function NodeContent({ node, color, iconSize, textSize }) {
  if (node?.text != null) return <Text style={[s.coinText, { color, fontSize: textSize }]}>{node.text}</Text>;
  return <Ionicons name={node?.icon || "ellipse-outline"} size={iconSize} color={color} />;
}

// ── Scene 1: SPV separation — central vault with 3 separated asset pods on a dashed orbit ──
export function Scene1({ active, reduced, size, theme }) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.34;
  const coreSize = size * 0.34;
  const podSize = size * 0.2;
  const PODS = [
    { icon: "business-outline", dx: 0, dy: -R },
    { icon: "hardware-chip-outline", dx: R * 0.866, dy: R * 0.5 },
    { icon: "diamond-outline", dx: -R * 0.866, dy: R * 0.5 },
  ];

  const bg = useSharedValue(0);
  const core = useSharedValue(0);
  const p0 = useSharedValue(0);
  const p1 = useSharedValue(0);
  const p2 = useSharedValue(0);

  useEffect(() => {
    const pods = [p0, p1, p2];
    if (!active) {
      bg.value = 0; core.value = 0; pods.forEach((p) => (p.value = 0));
      return;
    }
    if (reduced) {
      bg.value = 1; core.value = 1; pods.forEach((p) => (p.value = 1));
      return;
    }
    bg.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    core.value = withDelay(120, withSpring(1, { damping: 13, stiffness: 120 }));
    pods.forEach((p, i) => (p.value = withDelay(300 + i * 150, withSpring(1, { damping: 14, stiffness: 130 }))));
  }, [active, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const bgStyle = useAnimatedStyle(() => ({ opacity: bg.value, transform: [{ scale: 0.92 + 0.08 * bg.value }] }));
  const coreStyle = useAnimatedStyle(() => ({ opacity: core.value, transform: [{ scale: 0.6 + 0.4 * core.value }] }));
  const ps0 = useAnimatedStyle(() => ({ opacity: p0.value, transform: [{ translateX: PODS[0].dx * p0.value }, { translateY: PODS[0].dy * p0.value }, { scale: 0.5 + 0.5 * p0.value }] }));
  const ps1 = useAnimatedStyle(() => ({ opacity: p1.value, transform: [{ translateX: PODS[1].dx * p1.value }, { translateY: PODS[1].dy * p1.value }, { scale: 0.5 + 0.5 * p1.value }] }));
  const ps2 = useAnimatedStyle(() => ({ opacity: p2.value, transform: [{ translateX: PODS[2].dx * p2.value }, { translateY: PODS[2].dy * p2.value }, { scale: 0.5 + 0.5 * p2.value }] }));
  const podStyles = [ps0, ps1, ps2];

  return (
    <View style={{ width: size, height: size }}>
      <Glow size={size} />
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]} pointerEvents="none">
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={R} fill="none" stroke={GREEN} strokeOpacity={0.4} strokeWidth={1.4} strokeDasharray="5 9" />
          {PODS.map((pd, i) => (
            <Line key={i} x1={cx} y1={cy} x2={cx + pd.dx} y2={cy + pd.dy} stroke={GREEN} strokeOpacity={0.22} strokeWidth={1.2} strokeDasharray="3 6" />
          ))}
        </Svg>
      </Animated.View>
      <Animated.View style={[s.center, { left: cx - coreSize / 2, top: cy - coreSize / 2, width: coreSize, height: coreSize, borderRadius: coreSize / 2, backgroundColor: GREEN + "22", borderColor: GREEN + "66" }, coreStyle]}>
        <Ionicons name="shield-checkmark" size={coreSize * 0.5} color={theme.primary} />
      </Animated.View>
      {PODS.map((pd, i) => (
        <Animated.View key={i} style={[s.pod, { left: cx - podSize / 2, top: cy - podSize / 2, width: podSize, height: podSize, borderRadius: podSize * 0.32, backgroundColor: GREEN + "1A", borderColor: GREEN + "55" }, podStyles[i]]}>
          <Ionicons name={pd.icon} size={podSize * 0.46} color={GREEN_LT} />
        </Animated.View>
      ))}
    </View>
  );
}

// ── OrbitScene: a central medallion with up to 5 populated pods on a dashed orbit + connectors,
//    plus an optional corner badge. Used by most slides with distinct icons/text/angles. ──
function OrbitScene({ active, reduced, size, theme, center, pods = [], badge, converge = false }) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.345;
  const coreSize = size * 0.34;
  const podSize = size * 0.2;

  const placed = pods.slice(0, 5).map((p) => ({ ...p, dx: R * Math.cos(rad(p.angle)), dy: R * Math.sin(rad(p.angle)) }));

  const bg = useSharedValue(0);
  const core = useSharedValue(0);
  const v0 = useSharedValue(0);
  const v1 = useSharedValue(0);
  const v2 = useSharedValue(0);
  const v3 = useSharedValue(0);
  const v4 = useSharedValue(0);
  const bd = useSharedValue(0);
  const vals = [v0, v1, v2, v3, v4];

  useEffect(() => {
    if (!active) {
      bg.value = 0; core.value = 0; bd.value = 0; vals.forEach((v) => (v.value = 0));
      return;
    }
    if (reduced) {
      bg.value = 1; core.value = 1; bd.value = 1; vals.forEach((v) => (v.value = 1));
      return;
    }
    bg.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    core.value = withDelay(120, withSpring(1, { damping: 13, stiffness: 120 }));
    placed.forEach((_, i) => (vals[i].value = withDelay(300 + i * 130, withSpring(1, { damping: 14, stiffness: 140 }))));
    bd.value = withDelay(300 + placed.length * 130 + 120, withSpring(1, { damping: 12, stiffness: 150 }));
  }, [active, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const bgStyle = useAnimatedStyle(() => ({ opacity: bg.value, transform: [{ scale: 0.92 + 0.08 * bg.value }] }));
  const coreStyle = useAnimatedStyle(() => ({ opacity: core.value, transform: [{ scale: 0.6 + 0.4 * core.value }] }));
  // converge=true → pods start beyond the orbit and settle inward (toward the hub).
  const usePodStyle = (v, dx, dy) =>
    useAnimatedStyle(() => ({
      opacity: v.value,
      transform: [
        { translateX: dx * (converge ? 1.25 - 0.25 * v.value : v.value) },
        { translateY: dy * (converge ? 1.25 - 0.25 * v.value : v.value) },
        { scale: 0.5 + 0.5 * v.value },
      ],
    }));
  const ps = [
    usePodStyle(v0, placed[0]?.dx || 0, placed[0]?.dy || 0),
    usePodStyle(v1, placed[1]?.dx || 0, placed[1]?.dy || 0),
    usePodStyle(v2, placed[2]?.dx || 0, placed[2]?.dy || 0),
    usePodStyle(v3, placed[3]?.dx || 0, placed[3]?.dy || 0),
    usePodStyle(v4, placed[4]?.dx || 0, placed[4]?.dy || 0),
  ];
  const badgeStyle = useAnimatedStyle(() => ({ opacity: bd.value, transform: [{ scale: 0.5 + 0.5 * bd.value }] }));

  return (
    <View style={{ width: size, height: size }}>
      <Glow size={size} />
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]} pointerEvents="none">
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={R} fill="none" stroke={GREEN} strokeOpacity={0.38} strokeWidth={1.4} strokeDasharray="5 9" />
          {placed.map((pd, i) => (
            <Line key={i} x1={cx} y1={cy} x2={cx + pd.dx} y2={cy + pd.dy} stroke={GREEN} strokeOpacity={0.2} strokeWidth={1.2} strokeDasharray="3 6" />
          ))}
        </Svg>
      </Animated.View>

      <Animated.View style={[s.center, { left: cx - coreSize / 2, top: cy - coreSize / 2, width: coreSize, height: coreSize, borderRadius: coreSize / 2, backgroundColor: GREEN + "22", borderColor: GREEN + "66" }, coreStyle]}>
        <NodeContent node={center} color={theme.primary} iconSize={coreSize * 0.46} textSize={coreSize * 0.3} />
      </Animated.View>

      {placed.map((pd, i) => (
        <Animated.View key={i} style={[s.pod, { left: cx - podSize / 2, top: cy - podSize / 2, width: podSize, height: podSize, borderRadius: podSize * 0.32, backgroundColor: GREEN + "1A", borderColor: GREEN + "55" }, ps[i]]}>
          <NodeContent node={pd} color={GREEN_LT} iconSize={podSize * 0.46} textSize={podSize * 0.34} />
        </Animated.View>
      ))}

      {badge ? (
        <Animated.View style={[s.badge, { top: size * 0.1, right: size * 0.08 }, badgeStyle]}>
          {badge.icon ? <Ionicons name={badge.icon} size={14} color="#0b2928" /> : <Text style={[s.badgeText, { fontSize: 12 }]}>{badge.text}</Text>}
        </Animated.View>
      ) : null}
    </View>
  );
}

// ── Scene 3: Exit / liquidity — two marketplace nodes with an exchange hub between them ──
export function Scene3({ active, reduced, size, theme }) {
  const cx = size / 2;
  const cy = size / 2;
  const off = size * 0.3;
  const coreSize = size * 0.26;
  const sideSize = size * 0.22;

  const bg = useSharedValue(0);
  const core = useSharedValue(0);
  const l = useSharedValue(0);
  const r = useSharedValue(0);

  useEffect(() => {
    if (!active) { bg.value = 0; core.value = 0; l.value = 0; r.value = 0; return; }
    if (reduced) { bg.value = 1; core.value = 1; l.value = 1; r.value = 1; return; }
    bg.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    l.value = withDelay(160, withSpring(1, { damping: 14, stiffness: 140 }));
    r.value = withDelay(300, withSpring(1, { damping: 14, stiffness: 140 }));
    core.value = withDelay(440, withSpring(1, { damping: 12, stiffness: 150 }));
  }, [active, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const bgStyle = useAnimatedStyle(() => ({ opacity: bg.value }));
  const coreStyle = useAnimatedStyle(() => ({ opacity: core.value, transform: [{ scale: 0.5 + 0.5 * core.value }] }));
  const lStyle = useAnimatedStyle(() => ({ opacity: l.value, transform: [{ translateX: (-off) * l.value }, { scale: 0.6 + 0.4 * l.value }] }));
  const rStyle = useAnimatedStyle(() => ({ opacity: r.value, transform: [{ translateX: off * r.value }, { scale: 0.6 + 0.4 * r.value }] }));

  return (
    <View style={{ width: size, height: size }}>
      <Glow size={size} />
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]} pointerEvents="none">
        <Svg width={size} height={size}>
          <Line x1={cx - off} y1={cy} x2={cx + off} y2={cy} stroke={GREEN} strokeOpacity={0.25} strokeWidth={1.4} strokeDasharray="4 7" />
        </Svg>
      </Animated.View>
      {/* left marketplace node */}
      <Animated.View style={[s.pod, { left: cx - sideSize / 2, top: cy - sideSize / 2, width: sideSize, height: sideSize, borderRadius: sideSize * 0.3, backgroundColor: GREEN + "1A", borderColor: GREEN + "55" }, lStyle]}>
        <Ionicons name="storefront-outline" size={sideSize * 0.46} color={GREEN_LT} />
      </Animated.View>
      {/* right buyers node */}
      <Animated.View style={[s.pod, { left: cx - sideSize / 2, top: cy - sideSize / 2, width: sideSize, height: sideSize, borderRadius: sideSize * 0.3, backgroundColor: GREEN + "1A", borderColor: GREEN + "55" }, rStyle]}>
        <Ionicons name="people-outline" size={sideSize * 0.46} color={GREEN_LT} />
      </Animated.View>
      {/* center exchange hub */}
      <Animated.View style={[s.center, { left: cx - coreSize / 2, top: cy - coreSize / 2, width: coreSize, height: coreSize, borderRadius: coreSize / 2, backgroundColor: GREEN + "26", borderColor: GREEN + "77" }, coreStyle]}>
        <Ionicons name="swap-horizontal" size={coreSize * 0.5} color={theme.primary} />
      </Animated.View>
    </View>
  );
}

// ── Scene 8: Nova financing — a balanced 1 PRN = 1 USD exchange ──
export function Scene8({ active, reduced, size, theme }) {
  const cx = size / 2;
  const cy = size / 2;
  const off = size * 0.26;
  const coin = size * 0.28;

  const bg = useSharedValue(0);
  const lc = useSharedValue(0);
  const rc = useSharedValue(0);
  const eq = useSharedValue(0);

  useEffect(() => {
    if (!active) { bg.value = 0; lc.value = 0; rc.value = 0; eq.value = 0; return; }
    if (reduced) { bg.value = 1; lc.value = 1; rc.value = 1; eq.value = 1; return; }
    bg.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    lc.value = withDelay(160, withSpring(1, { damping: 14, stiffness: 140 }));
    rc.value = withDelay(300, withSpring(1, { damping: 14, stiffness: 140 }));
    eq.value = withDelay(460, withSpring(1, { damping: 12, stiffness: 160 }));
  }, [active, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const bgStyle = useAnimatedStyle(() => ({ opacity: bg.value }));
  const lStyle = useAnimatedStyle(() => ({ opacity: lc.value, transform: [{ translateX: (-off) * lc.value }, { scale: 0.6 + 0.4 * lc.value }] }));
  const rStyle = useAnimatedStyle(() => ({ opacity: rc.value, transform: [{ translateX: off * rc.value }, { scale: 0.6 + 0.4 * rc.value }] }));
  const eqStyle = useAnimatedStyle(() => ({ opacity: eq.value, transform: [{ scale: 0.5 + 0.5 * eq.value }] }));

  const coinStyle = { width: coin, height: coin, borderRadius: coin / 2, backgroundColor: GREEN + "22", borderColor: GREEN + "66" };
  return (
    <View style={{ width: size, height: size }}>
      <Glow size={size} />
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]} pointerEvents="none">
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={size * 0.4} fill="none" stroke={GREEN} strokeOpacity={0.18} strokeWidth={1.2} strokeDasharray="4 8" />
        </Svg>
      </Animated.View>
      <Animated.View style={[s.center, coinStyle, { left: cx - coin / 2, top: cy - coin / 2 }, lStyle]}>
        <Text style={[s.coinText, { fontSize: coin * 0.3 }]}>PRN</Text>
      </Animated.View>
      <Animated.View style={[s.center, coinStyle, { left: cx - coin / 2, top: cy - coin / 2 }, rStyle]}>
        <Text style={[s.coinText, { fontSize: coin * 0.4 }]}>$</Text>
      </Animated.View>
      <Animated.View style={[s.center, { left: cx - coin * 0.18, top: cy - coin * 0.28, width: coin * 0.36, height: coin * 0.56, borderWidth: 0 }, eqStyle]}>
        <Text style={{ color: theme.primary, fontSize: coin * 0.42, fontWeight: "800" }}>=</Text>
      </Animated.View>
    </View>
  );
}

// Per-slide scene config for the OrbitScene-based slides.
const ORBIT = {
  2: {
    center: { icon: "git-network-outline" },
    converge: true,
    pods: [
      { icon: "business-outline", angle: -90 },
      { icon: "hardware-chip-outline", angle: 0 },
      { icon: "bar-chart-outline", angle: 90 },
      { icon: "diamond-outline", angle: 180 },
    ],
  },
  4: {
    center: { icon: "ribbon-outline" },
    badge: { icon: "checkmark" },
    pods: [
      { icon: "star", angle: -90 },
      { icon: "star", angle: 30 },
      { icon: "star", angle: 150 },
    ],
  },
  5: {
    center: { icon: "umbrella-outline" },
    pods: [
      { icon: "business-outline", angle: 55 },
      { icon: "hardware-chip-outline", angle: 90 },
      { icon: "diamond-outline", angle: 125 },
    ],
  },
  6: {
    center: { icon: "wallet-outline" },
    pods: [
      { icon: "cash-outline", angle: -90 },
      { icon: "card-outline", angle: 0 },
      { icon: "logo-bitcoin", angle: 90 },
      { icon: "logo-usd", angle: 180 },
    ],
  },
  7: {
    center: { text: "PRN" },
    badge: { text: "+5%" },
    pods: [
      { icon: "business-outline", angle: -90 },
      { icon: "cube-outline", angle: 30 },
      { icon: "globe-outline", angle: 150 },
    ],
  },
  9: {
    center: { icon: "document-text-outline" },
    badge: { icon: "checkmark" },
    pods: [
      { icon: "lock-closed-outline", angle: -90 },
      { icon: "globe-outline", angle: 30 },
      { icon: "shield-checkmark-outline", angle: 150 },
    ],
  },
};

// Resolver: pick the bespoke scene per slide. Every scene populates all nodes (no empty circles).
export default function OnboardingScene({ n, active, reduced, size, theme }) {
  if (n === 1) return <Scene1 active={active} reduced={reduced} size={size} theme={theme} />;
  if (n === 3) return <Scene3 active={active} reduced={reduced} size={size} theme={theme} />;
  if (n === 8) return <Scene8 active={active} reduced={reduced} size={size} theme={theme} />;
  const cfg = ORBIT[n] || ORBIT[2];
  return <OrbitScene active={active} reduced={reduced} size={size} theme={theme} center={cfg.center} pods={cfg.pods} badge={cfg.badge} converge={cfg.converge} />;
}
