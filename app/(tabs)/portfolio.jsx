import React from "react";
import { useTranslation } from "react-i18next";
import PlaceholderScreen from "../../src/components/PlaceholderScreen";

export default function PortfolioTab() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t("sidebar.portfolio", "Portfolio")} icon="stats-chart-outline" note="Phase 6" />;
}
