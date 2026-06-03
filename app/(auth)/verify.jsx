import React from "react";
import { useTranslation } from "react-i18next";
import PlaceholderScreen from "../../src/components/PlaceholderScreen";

export default function VerifyScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t("verifyEmail.title", "Verify Email")} icon="mail-unread-outline" note="Coming in Phase 2" />;
}
