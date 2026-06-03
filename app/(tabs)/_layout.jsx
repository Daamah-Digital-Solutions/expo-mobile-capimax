import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import colors from "../../src/theme/colors";

// Bottom tabs (CLAUDE.md §4): Funds, MyFunds, Wallet, Portfolio, Market, More.
// Labels come from the web's sidebar.* translation keys (RTL handled by I18nManager).
export default function TabsLayout() {
  const { t } = useTranslation();

  const icon = (name) => ({ color, size }) => <Ionicons name={name} size={size} color={color} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryLight,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11 },
        sceneContainerStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="funds"
        options={{ title: t("sidebar.funds", "Assets"), tabBarIcon: icon("albums-outline") }}
      />
      <Tabs.Screen
        name="myfunds"
        options={{ title: t("sidebar.myFunds", "My Holdings"), tabBarIcon: icon("briefcase-outline") }}
      />
      <Tabs.Screen
        name="wallet"
        options={{ title: t("sidebar.wallet", "Wallet"), tabBarIcon: icon("wallet-outline") }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{ title: t("sidebar.portfolio", "Portfolio"), tabBarIcon: icon("stats-chart-outline") }}
      />
      <Tabs.Screen
        name="market"
        options={{ title: t("sidebar.internalMarket", "Internal Market"), tabBarIcon: icon("swap-horizontal-outline") }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: t("sidebar.more", "More"), tabBarIcon: icon("ellipsis-horizontal-outline") }}
      />
    </Tabs>
  );
}
