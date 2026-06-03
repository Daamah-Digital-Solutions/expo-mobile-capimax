import React from "react";
import { useTranslation } from "react-i18next";
import PlaceholderScreen from "../../src/components/PlaceholderScreen";

export default function MarketTab() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t("sidebar.internalMarket", "Internal Market")} icon="swap-horizontal-outline" note="Phase 7" />;
}
