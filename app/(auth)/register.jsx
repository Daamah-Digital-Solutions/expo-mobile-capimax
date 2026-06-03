import React from "react";
import { useTranslation } from "react-i18next";
import PlaceholderScreen from "../../src/components/PlaceholderScreen";

export default function RegisterScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t("register.title", "Register")} icon="person-add-outline" note="Coming in Phase 2" />;
}
