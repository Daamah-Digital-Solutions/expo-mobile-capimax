import React from "react";
import { useTranslation } from "react-i18next";
import PlaceholderScreen from "../../src/components/PlaceholderScreen";

// Web route is /reset-password/:token — the token will be read from params in Phase 2.
export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t("resetPassword.title", "Reset Password")} icon="lock-closed-outline" note="Coming in Phase 2" />;
}
