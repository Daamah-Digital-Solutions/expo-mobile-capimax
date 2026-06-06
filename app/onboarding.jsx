// Pre-login Onboarding (premium redesign). Shows on every launch before login; authenticated
// users never reach it (app/index.jsx redirects them to the tabs).
//
// Per slide: top row = themed logo + Skip · center = a large custom react-native-svg illustration
// scene (one concept per slide, staggered entrance choreography) · lower third = green uppercase
// eyebrow + title (h2/600) + one-line description (fade-up after the scene) · bottom = elongated
// progress dots + a circular primary Next button (last slide → Get Started pill).
//
// All 9 slides + copy preserved. Design system spacing, both themes, RTL (native pager + dots +
// controls mirror; Next arrow follows reading direction). Calm motion, reduce-motion safe.
//
// NOTE: Scene 1 is the bespoke reference illustration; slides 2–9 currently use a coherent branded
// generic scene and will each receive a bespoke scene next (see OnboardingScenes.jsx).
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, FlatList, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming, useReducedMotion } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../src/components/Screen";
import AppButton from "../src/components/AppButton";
import Logo from "../src/components/Logo";
import OnboardingScene from "../src/components/onboarding/OnboardingScenes";
import { useTheme } from "../src/context/ThemeContext";
import { useLanguage } from "../src/context/LanguageContext";
import { useAuth } from "../src/context/AuthContext";

// Per-slide icon (used by the generic scene + as a concept hint). Scene 1 is fully bespoke.
const SLIDES = [
  { n: 1, icon: "shield-checkmark-outline" },
  { n: 2, icon: "pie-chart-outline" },
  { n: 3, icon: "swap-horizontal-outline" },
  { n: 4, icon: "ribbon-outline" },
  { n: 5, icon: "umbrella-outline" },
  { n: 6, icon: "card-outline" },
  { n: 7, icon: "sparkles-outline" },
  { n: 8, icon: "cash-outline" },
  { n: 9, icon: "shield-checkmark-outline" },
];

export default function Onboarding() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const { completeOnboarding } = useAuth();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL, spacing), [theme, radii, isRTL, spacing]);

  const listRef = useRef(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  // RTL-safe visible-index tracking.
  const onViewRef = useRef(({ viewableItems }) => {
    const first = viewableItems?.[0];
    if (first && first.index != null) setIndex(first.index);
  });
  const viewCfgRef = useRef({ itemVisiblePercentThreshold: 60 });

  const finish = () => {
    completeOnboarding(); // allow the auth screens for the rest of this launch
    router.replace("/(auth)/login");
  };
  const next = () => {
    if (isLast) return finish();
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const sceneSize = Math.min(width * 0.78, 320);

  return (
    <Screen edges={["top", "bottom"]}>
      {/* Top row: brand + Skip */}
      <View style={styles.topRow}>
        <Logo height={20} />
        <Pressable onPress={finish} hitSlop={10} style={styles.skipBtn}>
          <Text style={styles.skipText}>{t("onboarding.skip", "Skip")}</Text>
        </Pressable>
      </View>

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
          <Slide item={item} active={index === item.n - 1} width={width} sceneSize={sceneSize} t={t} theme={theme} type={type} styles={styles} />
        )}
      />

      {/* Bottom row: dots + circular Next (or Get Started on the last slide) */}
      <View style={styles.bottomRow}>
        <View style={styles.dotsRow}>
          {SLIDES.map((s, i) => (
            <Dot key={s.n} active={index === i} styles={styles} />
          ))}
        </View>

        {isLast ? (
          <AppButton
            title={t("onboarding.getStarted", "Get Started")}
            icon="arrow-forward"
            fullWidth={false}
            style={{ minWidth: 150 }}
            onPress={finish}
          />
        ) : (
          <Pressable style={styles.nextBtn} onPress={next} accessibilityRole="button" accessibilityLabel={t("onboarding.next", "Next")}>
            <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={24} color={theme.onPrimary} />
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

function Slide({ item, active, width, sceneSize, t, theme, type, styles }) {
  const reduced = useReducedMotion();
  const text = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    if (!active) {
      text.value = 0;
      return;
    }
    if (reduced) {
      text.value = 1;
      return;
    }
    // Title/desc fade up AFTER the illustration's entrance choreography.
    text.value = withDelay(520, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [active, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const textStyle = useAnimatedStyle(() => ({ opacity: text.value, transform: [{ translateY: (1 - text.value) * 16 }] }));

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.illoArea}>
        <OnboardingScene n={item.n} active={active} reduced={reduced} size={sceneSize} theme={theme} />
      </View>

      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={styles.eyebrow}>{t(`onboarding.eyebrow${item.n}`, "")}</Text>
        <Text style={[type.h2, styles.title]}>{t(`onboarding.title${item.n}`)}</Text>
        <Text style={[type.body, styles.desc]}>{t(`onboarding.desc${item.n}`)}</Text>
      </Animated.View>
    </View>
  );
}

function Dot({ active, styles }) {
  const reduced = useReducedMotion();
  const w = useSharedValue(active ? 22 : 8);
  useEffect(() => {
    w.value = reduced ? (active ? 22 : 8) : withTiming(active ? 22 : 8, { duration: 240 });
  }, [active, reduced]); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({ width: w.value }));
  return <Animated.View style={[styles.dot, active ? styles.dotActive : styles.dotIdle, style]} />;
}

const makeStyles = (theme, radii, isRTL, spacing) =>
  StyleSheet.create({
    topRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    skipBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
    skipText: { color: theme.textMuted, fontSize: 14, fontWeight: "700" },

    // Slide: illustration fills the upper/center; text sits in the lower third.
    slide: { flex: 1, paddingHorizontal: spacing.xl },
    illoArea: { flex: 1, alignItems: "center", justifyContent: "center" },
    textBlock: { paddingBottom: spacing["2xl"], alignItems: "center", gap: spacing.sm },
    eyebrow: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1.5,
      textTransform: "uppercase",
      textAlign: "center",
    },
    title: { color: theme.text, fontWeight: "600", textAlign: "center", paddingHorizontal: spacing.sm },
    desc: { color: theme.textSecondary, textAlign: "center", lineHeight: 22, paddingHorizontal: spacing.md },

    bottomRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    dotsRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: spacing.sm },
    dot: { height: 8, borderRadius: 4 },
    dotIdle: { backgroundColor: theme.borderStrong },
    dotActive: { backgroundColor: theme.primary },

    nextBtn: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
  });
