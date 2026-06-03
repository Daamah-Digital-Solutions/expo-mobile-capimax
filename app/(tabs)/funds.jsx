import React from "react";
import { useTranslation } from "react-i18next";
import PlaceholderScreen from "../../src/components/PlaceholderScreen";

export default function FundsTab() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t("sidebar.funds", "Assets")} icon="albums-outline" note="Phase 3" />;
}
