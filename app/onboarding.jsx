// Pre-login Onboarding sliders (Phase: onboarding). Shows on every launch before login;
// authenticated users never reach it (app/index.jsx redirects them to the tabs).
// Full-screen horizontal pager. Each slide: outline icon in a rounded tinted box over a soft
// brand-tinted circle accent, a strong title, a one-line description. Progress dots (active =
// elongated green pill) + a bottom row: Skip (ghost) / Next (primary); last slide → Get Started.
// Design system, both themes, RTL (native pager + dots mirror), calm motion (reduce-motion safe).
//
// NOTE: 9 slides total — only the FIRST 3 are built here for device approval; the rest follow.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, FlatList, StyleSheet, useWindowDimensions } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, useReducedMotion } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../src/components/Screen";
import AppButton from "../src/components/AppButton";
import Logo from "../src/components/Logo";
import { useTheme } from "../src/context/ThemeContext";
import { useLanguage } from "../src/context/LanguageContext";

// Icon names map to the nearest Ionicons outline (no custom illustrations):
//   1 shield-lock → shield-checkmark · 2 chart-pie → pie-chart · 3 arrows-exchange → swap-horizontal
//   4 ribbon · 5 shield-checkmark · 6 card · 7 sparkles · 8 cash · 9 globe.
const SLIDES = [
  { n: 1, icon: "shield-checkmark-outline" },
  { n: 2, icon: "pie-chart-outline" },
  { n: 3, icon: "swap-horizontal-outline" },
  { n: 4, icon: "ribbon-outline" },
  { n: 5, icon: "shield-checkmark-outline" },
  { n: 6, icon: "card-outline" },
  { n: 7, icon: "sparkles-outline" },
  { n: 8, icon: "cash-outline" },
  { n: 9, icon: "globe-outline" },
];

export default function Onboarding() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const listRef = useRef(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  // onViewableItemsChanged reports the visible index correctly in BOTH directions (RTL-safe),
  // unlike contentOffset math which inverts on some platforms under RTL.
  const onViewRef = useRef(({ viewableItems }) => {
    const first = viewableItems?.[0];
    if (first && first.index != null) setIndex(first.index);
  });
  const viewCfgRef = useRef({ itemVisiblePercentThreshold: 60 });

  const finish = () => router.replace("/(auth)/login");
  const next = () => {
    if (isLast) return finish();
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <View style={styles.brandRow}>
        <Logo height={22} />
      </View>
      <View style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(s) => String(s.n)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onViewableItemsChanged={onViewRef.current}
          viewabilityConfig={viewCfgRef.current}
          renderItem={({ item }) => (
            <Slide item={item} active={index === item.n - 1} width={width} t={t} theme={theme} type={type} spacing={spacing} styles={styles} isRTL={isRTL} />
          )}
        />
      </View>

      {/* Progress dots (mirror order in RTL) */}
      <View style={styles.dotsRow}>
        {SLIDES.map((s, i) => (
          <Dot key={s.n} active={index === i} theme={theme} styles={styles} />
        ))}
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        <AppButton title={t("onboarding.skip", "Skip")} variant="ghost" fullWidth={false} onPress={finish} />
        <AppButton
          title={isLast ? t("onboarding.getStarted", "Get Started") : t("onboarding.next", "Next")}
          icon={isLast ? "rocket-outline" : "arrow-forward"}
          fullWidth={false}
          style={{ minWidth: 160 }}
          onPress={next}
        />
      </View>
    </Screen>
  );
}

function Slide({ item, active, width, t, theme, type, spacing, styles, isRTL }) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(active ? 1 : 0.82);
  const opacity = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      scale.value = 1;
      opacity.value = active ? 1 : 0.35;
      return;
    }
    scale.value = withSpring(active ? 1 : 0.82, { damping: 15, stiffness: 140 });
    opacity.value = withTiming(active ? 1 : 0.35, { duration: 320 });
  }, [active, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const iconStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  return (
    <View style={[styles.slide, { width, paddingHorizontal: spacing.xl }]}>
      {/* Soft brand-tinted background circle accent */}
      <View style={styles.accentCircle} pointerEvents="none" />

      <Animated.View style={[styles.iconBox, iconStyle]}>
        <Ionicons name={item.icon} size={68} color={theme.primary} />
      </Animated.View>

      <Text style={[type.h2, styles.title]}>{t(`onboarding.title${item.n}`)}</Text>
      <Text style={[type.body, styles.desc]}>{t(`onboarding.desc${item.n}`)}</Text>
    </View>
  );
}

function Dot({ active, theme, styles }) {
  const reduced = useReducedMotion();
  const w = useSharedValue(active ? 22 : 8);
  useEffect(() => {
    w.value = reduced ? (active ? 22 : 8) : withTiming(active ? 22 : 8, { duration: 240 });
  }, [active, reduced]); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({ width: w.value }));
  return <Animated.View style={[styles.dot, active ? styles.dotActive : styles.dotIdle, style]} />;
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    brandRow: { alignItems: "center", paddingTop: 6, paddingBottom: 2 },
    slide: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18 },
    accentCircle: {
      position: "absolute",
      top: "14%",
      width: 320,
      height: 320,
      borderRadius: 160,
      backgroundColor: theme.primary + "14",
    },
    iconBox: {
      width: 132,
      height: 132,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary + "1F",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.primary + "40",
      marginBottom: 14,
    },
    title: { color: theme.text, fontWeight: "600", textAlign: "center", paddingHorizontal: 8 },
    desc: { color: theme.textSecondary, textAlign: "center", lineHeight: 22, paddingHorizontal: 8 },

    dotsRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
    },
    dot: { height: 8, borderRadius: 4 },
    dotIdle: { backgroundColor: theme.borderStrong },
    dotActive: { backgroundColor: theme.primary },

    controls: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 6,
      paddingBottom: 8,
    },
  });
