import React from "react";
import { Platform } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/context/ThemeContext";

// Bottom tabs (DESIGN.md §7): surface bg, soft top shadow (light) / hairline top border (dark),
// active = primary, inactive = textMuted. Labels from sidebar.* (RTL via I18nManager).
export default function TabsLayout() {
  const { t } = useTranslation();
  const { theme, scheme } = useTheme();

  const icon = (name) => ({ color, size }) => <Ionicons name={name} size={size} color={color} />;

  const elevatedTabBar =
    scheme === "light"
      ? {
          shadowColor: "#0b2928",
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
          borderTopWidth: 0,
        }
      : { borderTopWidth: 0.5, borderTopColor: theme.border };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.surface,
          height: Platform.OS === "ios" ? 86 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          ...elevatedTabBar,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        sceneStyle: { backgroundColor: theme.bg },
      }}
    >
      <Tabs.Screen name="funds" options={{ title: t("sidebar.funds", "Assets"), tabBarIcon: icon("albums-outline") }} />
      <Tabs.Screen name="myfunds" options={{ title: t("sidebar.myFunds", "My Holdings"), tabBarIcon: icon("briefcase-outline") }} />
      <Tabs.Screen name="wallet" options={{ title: t("sidebar.wallet", "Wallet"), tabBarIcon: icon("wallet-outline") }} />
      <Tabs.Screen name="portfolio" options={{ title: t("sidebar.portfolio", "Portfolio"), tabBarIcon: icon("stats-chart-outline") }} />
      <Tabs.Screen name="market" options={{ title: t("sidebar.internalMarket", "Internal Market"), tabBarIcon: icon("swap-horizontal-outline") }} />
      <Tabs.Screen name="more" options={{ title: t("sidebar.more", "More"), tabBarIcon: icon("ellipsis-horizontal-outline") }} />
    </Tabs>
  );
}
