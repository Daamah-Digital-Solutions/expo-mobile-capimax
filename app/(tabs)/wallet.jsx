import React from "react";
import { useTranslation } from "react-i18next";
import PlaceholderScreen from "../../src/components/PlaceholderScreen";

export default function WalletTab() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t("sidebar.wallet", "Wallet")} icon="wallet-outline" note="Phase 5" />;
}
