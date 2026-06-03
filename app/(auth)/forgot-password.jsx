import React from "react";
import { useTranslation } from "react-i18next";
import PlaceholderScreen from "../../src/components/PlaceholderScreen";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t("forgotPassword.title", "Forgot Password")} icon="key-outline" note="Coming in Phase 2" />;
}
