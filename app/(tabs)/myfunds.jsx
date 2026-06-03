import React from "react";
import { useTranslation } from "react-i18next";
import PlaceholderScreen from "../../src/components/PlaceholderScreen";

export default function MyFundsTab() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t("sidebar.myFunds", "My Holdings")} icon="briefcase-outline" note="Phase 6" />;
}
