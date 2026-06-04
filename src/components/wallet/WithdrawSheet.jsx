// Withdraw form (Flow G) in a BottomSheet, matching the web WithdrawForm.
//   POST /api/wallet/withdraw/ { amount, withdraw_profit_only, bank_name,
//     account_number, account_holder_name, swift_code, iban }
//   success: response.data.status === 'success' → show message, wait ~1.5s, then
//     onSuccess() (parent closes + refetches summary/transactions/withdrawals).
//   error: map response.data.errors[field][0]; errors.amount "Insufficient total
//     balance" → dedicated insufficient-balance message.
import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Switch, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";

import BottomSheet from "../BottomSheet";
import Field from "../Field";
import AppButton from "../AppButton";
import Banner from "../Banner";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { walletService } from "../../api/services";

const EMPTY = {
  amount: "",
  withdraw_profit_only: false,
  bank_name: "",
  account_number: "",
  account_holder_name: "",
  swift_code: "",
  iban: "",
};

export default function WithdrawSheet({ visible, onClose, onSuccess }) {
  const { t } = useTranslation();
  const { theme, type } = useTheme();
  const { isRTL } = useLanguage();
  const { height } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(theme, isRTL), [theme, isRTL]);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const timer = useRef(null);

  // Reset state whenever the sheet opens; clear any pending success timer on unmount.
  useEffect(() => {
    if (visible) {
      setForm(EMPTY);
      setError("");
      setSuccess("");
      setFieldErrors({});
      setLoading(false);
    }
  }, [visible]);
  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  const set = (key) => (value) => setForm((p) => ({ ...p, [key]: value }));

  const canSubmit =
    !loading &&
    !success &&
    form.amount.trim() &&
    form.bank_name.trim() &&
    form.account_number.trim() &&
    form.account_holder_name.trim() &&
    form.swift_code.trim() &&
    form.iban.trim();

  const submit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setFieldErrors({});
    try {
      const res = await walletService.withdraw({
        amount: form.amount,
        withdraw_profit_only: form.withdraw_profit_only,
        bank_name: form.bank_name,
        account_number: form.account_number,
        account_holder_name: form.account_holder_name,
        swift_code: form.swift_code,
        iban: form.iban,
      });
      if (res?.data?.status === "success") {
        setSuccess(res.data?.message || t("wallet.withdrawSuccess", "Withdrawal request submitted"));
        // Match web: show success ~1.5s, then let the parent close + refetch.
        timer.current = setTimeout(() => onSuccess?.(), 1500);
      } else {
        setLoading(false);
        setError(res?.data?.message || t("wallet.withdrawError", "Failed to process withdrawal request"));
      }
    } catch (err) {
      setLoading(false);
      const errs = err?.response?.data?.errors;
      if (errs) {
        setFieldErrors(errs);
        if (Array.isArray(errs.amount) && errs.amount.some((m) => String(m).includes("Insufficient total balance"))) {
          setError(t("wallet.insufficientBalance", "You don't have sufficient balance for this withdrawal"));
        }
      } else {
        setError(err?.response?.data?.message || err?.message || t("wallet.withdrawError", "Failed to process withdrawal request"));
      }
    }
  };

  const fe = (k) => (Array.isArray(fieldErrors[k]) ? fieldErrors[k][0] : undefined);

  return (
    <BottomSheet visible={visible} onClose={loading ? () => {} : onClose} title={t("wallet.withdrawFunds", "Withdraw Funds")}>
      <ScrollView
        style={{ maxHeight: height * 0.62 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        {error ? <Banner type="error" message={error} /> : null}
        {success ? <Banner type="success" message={success} /> : null}

        <Field
          label={t("wallet.amount", "Amount")}
          value={form.amount}
          onChangeText={(v) => set("amount")(v.replace(/[^0-9.]/g, ""))}
          keyboardType="decimal-pad"
          placeholder="0.00"
          error={fe("amount")}
        />

        <View style={styles.switchRow}>
          <Text style={[type.body, { color: theme.text, flex: 1, textAlign: isRTL ? "right" : "left" }]}>
            {t("wallet.withdrawProfitOnly", "Withdraw from profit balance only")}
          </Text>
          <Switch
            value={form.withdraw_profit_only}
            onValueChange={set("withdraw_profit_only")}
            trackColor={{ false: theme.surfaceAlt, true: theme.primary }}
            thumbColor="#ffffff"
            ios_backgroundColor={theme.surfaceAlt}
          />
        </View>

        <Field label={t("wallet.bankName", "Bank Name")} value={form.bank_name} onChangeText={set("bank_name")} autoCapitalize="words" error={fe("bank_name")} />
        <Field label={t("wallet.accountNumber", "Account Number")} value={form.account_number} onChangeText={set("account_number")} error={fe("account_number")} />
        <Field label={t("wallet.accountHolderName", "Account Holder Name")} value={form.account_holder_name} onChangeText={set("account_holder_name")} autoCapitalize="words" error={fe("account_holder_name")} />
        <Field label={t("wallet.swiftCode", "SWIFT Code")} value={form.swift_code} onChangeText={set("swift_code")} autoCapitalize="characters" error={fe("swift_code")} />
        <Field label={t("wallet.iban", "IBAN")} value={form.iban} onChangeText={set("iban")} autoCapitalize="characters" error={fe("iban")} />

        <View style={styles.actions}>
          <AppButton title={t("common.cancel", "Cancel")} variant="ghost" fullWidth={false} onPress={loading ? undefined : onClose} disabled={loading || !!success} />
          <AppButton title={t("common.submit", "Submit")} fullWidth={false} style={{ minWidth: 140 }} loading={loading} disabled={!canSubmit} onPress={submit} />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const makeStyles = (theme, isRTL) =>
  StyleSheet.create({
    switchRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, paddingVertical: 2 },
    actions: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 6 },
  });
