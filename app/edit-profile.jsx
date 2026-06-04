// Edit / Complete Profile (Phase 8 — Flow H), mirroring web pages/edit/index.jsx.
//   1. GET /api/users/me/ to prefill.
//   2. multipart POST /api/users/complete_profile/ with phone_number, passport_number,
//      nationality, address, profession, custom_profession, passport_scan ({uri,name,type}),
//      documents_submitted_at (set when a file is chosen). Validate file type + ≤5MB.
//   3. Success → document_status.has_passport becomes true (unblocks the Buy flow).
// Zero mock; skeleton / error; both modes + RTL. The Buy-flow gate routes here.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../src/components/Screen";
import Card from "../src/components/Card";
import Banner from "../src/components/Banner";
import Field from "../src/components/Field";
import SelectField from "../src/components/SelectField";
import AppButton from "../src/components/AppButton";
import Skeleton from "../src/components/Skeleton";
import SectionHeader from "../src/components/SectionHeader";
import FadeInView from "../src/components/motion/FadeInView";
import FilePickerButton from "../src/components/invest/FilePickerButton";
import { useTheme } from "../src/context/ThemeContext";
import { useLanguage } from "../src/context/LanguageContext";
import { userService } from "../src/api/services";
import { COUNTRIES } from "../src/constants/countries";

const EMPTY = {
  phone_number: "",
  passport_number: "",
  nationality: "",
  address: "",
  profession: null,
  custom_profession: "",
  documents_submitted_at: null,
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);
  const scrollRef = useRef(null);

  const [form, setForm] = useState(EMPTY);
  const [docStatus, setDocStatus] = useState(null);
  const [passportFile, setPassportFile] = useState(null); // { uri, name, type }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const PROFESSIONS = useMemo(() => ([
    { value: "engineer", label: t("edit.engineer", "Engineer") },
    { value: "doctor", label: t("edit.doctor", "Doctor") },
    { value: "businessman", label: t("edit.businessman", "Businessman") },
    { value: "other", label: t("edit.other", "Other") },
  ]), [t]);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await userService.me();
      const d = res?.data || {};
      setForm({
        phone_number: d.phone_number || "",
        passport_number: d.passport_number || "",
        nationality: d.nationality || "",
        address: d.address || "",
        profession: d.profession || null,
        custom_profession: d.custom_profession || "",
        documents_submitted_at: d.documents_submitted_at || null,
      });
      setDocStatus(d.document_status || null);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t("edit.errorLoadingProfile", "Failed to load profile data"));
      throw err;
    }
  }, [t]);

  useEffect(() => {
    setLoading(true);
    load().catch(() => {}).finally(() => setLoading(false));
  }, [load]);

  const set = (key) => (value) => setForm((p) => ({ ...p, [key]: value }));

  const onPickFile = (file) => {
    setError("");
    setPassportFile(file);
    // Match web: stamp documents_submitted_at when a file is chosen.
    setForm((p) => ({ ...p, documents_submitted_at: new Date().toISOString() }));
  };

  const isOther = form.profession === "other";
  const canSubmit =
    !saving && !!form.phone_number.trim() && !!form.passport_number.trim() &&
    !!form.nationality && !!form.address.trim() && (!isOther || !!form.custom_profession.trim());

  const submit = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const fd = new FormData();
      // Append non-null fields (matches the web: skip passport_scan here + skip nulls).
      Object.keys(form).forEach((key) => {
        if (form[key] !== null && form[key] !== undefined) fd.append(key, form[key]);
      });
      if (passportFile) fd.append("passport_scan", passportFile);

      await userService.completeProfile(fd);
      setSaving(false);
      setSuccess(t("edit.successMessage", "Profile updated successfully!"));
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      // Refresh document status so the verification banner + passport state reflect the update.
      load().catch(() => {});
    } catch (err) {
      setSaving(false);
      setError(err?.response?.data?.message || err?.message || t("edit.updateFailed", "Failed to update profile"));
    }
  };

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <Pressable style={styles.headerBack} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color={theme.text} />
      </Pressable>
      <Text style={[type.label, { color: theme.text }]}>{t("edit.title", "Complete Profile")}</Text>
      <View style={styles.headerBack} />
    </View>
  );

  if (loading) {
    return (
      <Screen edges={["bottom"]}>
        {Header}
        <View style={{ padding: spacing.xl, gap: 14 }}>
          <Skeleton width="100%" height={52} radius={radii.input} />
          <Skeleton width="100%" height={52} radius={radii.input} />
          <Skeleton width="100%" height={52} radius={radii.input} />
          <Skeleton width="100%" height={100} radius={radii.card} />
        </View>
      </Screen>
    );
  }

  const dvs = docStatus
    ? docStatus.verification_status === "verified"
      ? { type: "success", msg: t("edit.documentsVerified", "Your documents have been verified. You can still update them if needed.") }
      : docStatus.verification_status === "pending"
        ? { type: "info", msg: docStatus.verification_notes || t("edit.documentsUnderReview", "Your documents are under review") }
        : { type: "warning", msg: t("edit.documentsNotSubmitted", "Please submit your identification documents for verification") }
    : null;

  return (
    <Screen edges={["bottom"]}>
      {Header}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 + insets.bottom, gap: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {success ? <Banner type="success" message={success} /> : null}
        {error ? <Banner type="error" message={error} /> : null}

        {/* Personal information */}
        <FadeInView index={0} style={{ gap: 12 }}>
          <SectionHeader title={t("edit.personalInformation", "Personal Information")} />
          <Field label={t("edit.phoneNumber", "Phone Number")} value={form.phone_number} onChangeText={set("phone_number")} keyboardType="phone-pad" />
          <Field label={t("edit.passportNumber", "Passport Number")} value={form.passport_number} onChangeText={set("passport_number")} autoCapitalize="characters" />
          <SelectField
            label={t("edit.nationality", "Nationality")}
            value={form.nationality}
            options={COUNTRIES}
            onChange={set("nationality")}
            placeholder={t("edit.nationality", "Nationality")}
            searchable
          />
          <Field label={t("edit.address", "Address")} value={form.address} onChangeText={set("address")} autoCapitalize="words" />
        </FadeInView>

        {/* Professional information */}
        <FadeInView index={1} style={{ gap: 12 }}>
          <SectionHeader title={t("edit.professionalInformation", "Professional Information")} />
          <SelectField
            label={t("edit.profession", "Profession")}
            value={form.profession}
            options={PROFESSIONS}
            onChange={set("profession")}
            placeholder={t("edit.selectProfession", "Select Profession")}
          />
          {isOther ? (
            <Field label={t("edit.specifyProfession", "Specify Profession")} value={form.custom_profession} onChangeText={set("custom_profession")} autoCapitalize="words" />
          ) : null}
        </FadeInView>

        {/* Document upload */}
        <FadeInView index={2} style={{ gap: 12 }}>
          <SectionHeader title={t("edit.documentUpload", "Document Upload")} />
          {dvs ? <Banner type={dvs.type} message={dvs.msg} /> : null}
          <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>
            {t("edit.passportDocument", "Passport Document")} {docStatus?.has_passport ? t("edit.previouslySubmitted", "(Previously submitted)") : ""}
          </Text>
          <FilePickerButton file={passportFile} onPick={onPickFile} onError={setError} label={t("edit.uploadPassport", "Upload Passport Copy")} />
          <Text style={[type.micro, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>
            {t("edit.fileHint", "PDF, JPG or PNG · up to 5MB")}
          </Text>
        </FadeInView>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <AppButton title={t("edit.updateProfile", "Update Profile")} icon="checkmark" loading={saving} disabled={!canSubmit} onPress={submit} />
      </View>
    </Screen>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    header: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 8 },
    headerBack: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
    footer: {
      position: "absolute", left: 0, right: 0, bottom: 0,
      paddingHorizontal: 20, paddingTop: 10,
      backgroundColor: theme.surface,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border,
    },
  });
