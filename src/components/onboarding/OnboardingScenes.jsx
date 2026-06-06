// Onboarding illustrations — large, custom react-native-svg "scenes", one concept per slide.
// Each scene animates in with a staggered choreography driven by the slide's `active` flag
// (reanimated). Brand green accents over the themed background, with a soft ambient green glow.
// Reduce-motion → elements appear in their final state instantly.
//
// Scene1 (SPV separation) is the bespoke reference scene. SceneGeneric is a coherent branded
// fallback used for slides not yet given a custom scene — it is NOT mock data, just UI pending the
// per-slide bespoke illustrations.
import React, { useEffect, useId } from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Defs, RadialGradient, Stop, Line } from "react-native-svg";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";

const GREEN = "#2ead6f";
const GREEN_LT = "#54c98a";

// Soft ambient radial glow behind a scene (unique gradient id per instance).
function Glow({ size }) {
  const gid = useId().replace(/[:]/g, "");
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

const baseStyles = StyleSheet.create({
  center: { position: "absolute", alignItems: "center", justifyContent: "center", borderWidth: 1 },
  pod: { position: "absolute", alignItems: "center", justifyContent: "center", borderWidth: 1 },
});

// ── Scene 1: SPV separation — a central protected vault with 3 separated asset pods on an orbit ──
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
      bg.value = 0;
      core.value = 0;
      pods.forEach((p) => (p.value = 0));
      return;
    }
    if (reduced) {
      bg.value = 1;
      core.value = 1;
      pods.forEach((p) => (p.value = 1));
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

      {/* Dashed orbit ring + connectors (fade + scale in together). */}
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]} pointerEvents="none">
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={R} fill="none" stroke={GREEN} strokeOpacity={0.4} strokeWidth={1.4} strokeDasharray="5 9" />
          {PODS.map((pd, i) => (
            <Line key={i} x1={cx} y1={cy} x2={cx + pd.dx} y2={cy + pd.dy} stroke={GREEN} strokeOpacity={0.22} strokeWidth={1.2} strokeDasharray="3 6" />
          ))}
        </Svg>
      </Animated.View>

      {/* Central protected vault. */}
      <Animated.View
        style={[
          baseStyles.center,
          { left: cx - coreSize / 2, top: cy - coreSize / 2, width: coreSize, height: coreSize, borderRadius: coreSize / 2, backgroundColor: GREEN + "22", borderColor: GREEN + "66" },
          coreStyle,
        ]}
      >
        <Ionicons name="shield-checkmark" size={coreSize * 0.5} color={theme.primary} />
      </Animated.View>

      {/* Separated asset pods (emanate from the vault). */}
      {PODS.map((pd, i) => (
        <Animated.View
          key={i}
          style={[
            baseStyles.pod,
            { left: cx - podSize / 2, top: cy - podSize / 2, width: podSize, height: podSize, borderRadius: podSize * 0.32, backgroundColor: GREEN + "1A", borderColor: GREEN + "55" },
            podStyles[i],
          ]}
        >
          <Ionicons name={pd.icon} size={podSize * 0.46} color={GREEN_LT} />
        </Animated.View>
      ))}
    </View>
  );
}

// ── Generic branded scene (fallback for slides without a bespoke scene yet) ──
// Central themed icon medallion + dashed ring + three small accent nodes that pop in.
export function SceneGeneric({ active, reduced, size, theme, icon }) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.34;
  const coreSize = size * 0.36;
  const nodeSize = size * 0.1;

  const NODES = [
    { dx: 0, dy: -R },
    { dx: R * 0.866, dy: R * 0.5 },
    { dx: -R * 0.866, dy: R * 0.5 },
  ];

  const bg = useSharedValue(0);
  const core = useSharedValue(0);
  const n0 = useSharedValue(0);
  const n1 = useSharedValue(0);
  const n2 = useSharedValue(0);

  useEffect(() => {
    const nodes = [n0, n1, n2];
    if (!active) {
      bg.value = 0;
      core.value = 0;
      nodes.forEach((p) => (p.value = 0));
      return;
    }
    if (reduced) {
      bg.value = 1;
      core.value = 1;
      nodes.forEach((p) => (p.value = 1));
      return;
    }
    bg.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    core.value = withDelay(120, withSpring(1, { damping: 13, stiffness: 120 }));
    nodes.forEach((p, i) => (p.value = withDelay(320 + i * 130, withSpring(1, { damping: 15, stiffness: 150 }))));
  }, [active, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const bgStyle = useAnimatedStyle(() => ({ opacity: bg.value, transform: [{ scale: 0.92 + 0.08 * bg.value }] }));
  const coreStyle = useAnimatedStyle(() => ({ opacity: core.value, transform: [{ scale: 0.6 + 0.4 * core.value }] }));
  const ns0 = useAnimatedStyle(() => ({ opacity: n0.value, transform: [{ translateX: NODES[0].dx * n0.value }, { translateY: NODES[0].dy * n0.value }, { scale: n0.value }] }));
  const ns1 = useAnimatedStyle(() => ({ opacity: n1.value, transform: [{ translateX: NODES[1].dx * n1.value }, { translateY: NODES[1].dy * n1.value }, { scale: n1.value }] }));
  const ns2 = useAnimatedStyle(() => ({ opacity: n2.value, transform: [{ translateX: NODES[2].dx * n2.value }, { translateY: NODES[2].dy * n2.value }, { scale: n2.value }] }));
  const nodeStyles = [ns0, ns1, ns2];

  return (
    <View style={{ width: size, height: size }}>
      <Glow size={size} />

      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]} pointerEvents="none">
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={R} fill="none" stroke={GREEN} strokeOpacity={0.38} strokeWidth={1.4} strokeDasharray="5 9" />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          baseStyles.center,
          { left: cx - coreSize / 2, top: cy - coreSize / 2, width: coreSize, height: coreSize, borderRadius: coreSize / 2, backgroundColor: GREEN + "22", borderColor: GREEN + "66" },
          coreStyle,
        ]}
      >
        <Ionicons name={icon} size={coreSize * 0.48} color={theme.primary} />
      </Animated.View>

      {NODES.map((nd, i) => (
        <Animated.View
          key={i}
          style={[
            baseStyles.pod,
            { left: cx - nodeSize / 2, top: cy - nodeSize / 2, width: nodeSize, height: nodeSize, borderRadius: nodeSize / 2, backgroundColor: GREEN + "33", borderColor: GREEN + "66" },
            nodeStyles[i],
          ]}
        />
      ))}
    </View>
  );
}

// Resolver: pick the bespoke scene when available, else the branded generic.
export default function OnboardingScene({ n, icon, active, reduced, size, theme }) {
  if (n === 1) return <Scene1 active={active} reduced={reduced} size={size} theme={theme} />;
  return <SceneGeneric active={active} reduced={reduced} size={size} theme={theme} icon={icon} />;
}
