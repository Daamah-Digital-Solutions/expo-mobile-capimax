// Contact (Phase 9) — branch info cards (web pages/contact) + the functional feedback form
// (web pages/feedback, the "request" page).
//   email prefilled from GET users/me (user_details.email); POST /api/feedback/
//   { email, subject, message, email_to:'contact@capimaxinvestment.com', user_email }.
//   Success when response.data.status === 'success' (resets subject+message, keeps email).
// Zero mock; success/error states; both modes + RTL. Branch phones/email are real (verbatim).
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../src/components/Screen";
import Card from "../src/components/Card";
import Banner from "../src/components/Banner";
import Field from "../src/components/Field";
import AppButton from "../src/components/AppButton";
import SectionHeader from "../src/components/SectionHeader";
import FadeInView from "../src/components/motion/FadeInView";
import { useTheme } from "../src/context/ThemeContext";
import { useLanguage } from "../src/context/LanguageContext";
import { userService, feedbackService } from "../src/api/services";

const EMAIL = "info@capimaxinvestment.com";
const FEEDBACK_TO = "contact@capimaxinvestment.com";

export default function ContactScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const [form, setForm] = useState({ email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Prefill the user's email (best-effort; failure is non-blocking, matches web).
  useEffect(() => {
    let active = true;
    userService.me()
      .then((res) => { if (active) setForm((p) => ({ ...p, email: res?.data?.user_details?.email || "" })); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const BRANCHES = [
    { country: t("contact.uae", "UAE"), address: t("contact.uaeAddress", ""), phones: ["0097126289388", "0097126220546", "0097126271528", "0097126226527", "0097126214210"] },
    { country: t("contact.uk", "United Kingdom"), address: t("contact.ukAddress", ""), phones: ["00447441358588"] },
    { country: t("contact.usa", "United States"), address: t("contact.usaAddress", ""), phones: ["0012342795751"] },
  ];

  const set = (key) => (value) => setForm((p) => ({ ...p, [key]: value }));
  const canSubmit = !loading && form.email.trim() && form.subject.trim() && form.message.trim();

  const submit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await feedbackService.send({
        email: form.email,
        subject: form.subject,
        message: form.message,
        email_to: FEEDBACK_TO,
        user_email: form.email,
      });
      if (res?.data?.status === "success") {
        setLoading(false);
        setSuccess(res.data?.message || t("feedback.successMessage", "Your feedback has been sent successfully!"));
        setForm((p) => ({ ...p, subject: "", message: "" })); // keep email
      } else {
        setLoading(false);
        setError(res?.data?.message || t("feedback.errorMessage", "Failed to send feedback. Please try again."));
      }
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.message || err?.message || t("feedback.errorMessage", "Failed to send feedback. Please try again."));
    }
  };

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <Pressable style={styles.headerBack} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color={theme.text} />
      </Pressable>
      <Text style={[type.label, { color: theme.text }]}>{t("contact.title", "Contact Us")}</Text>
      <View style={styles.headerBack} />
    </View>
  );

  return (
    <Screen edges={["bottom"]}>
      {Header}
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40, gap: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[type.caption, { color: theme.textMuted, textAlign: isRTL ? "right" : "left" }]}>{t("contact.subtitle", "We'd love to hear from you")}</Text>

        {/* Branch cards */}
        {BRANCHES.map((b, i) => (
          <FadeInView key={b.country} index={i}>
            <Card style={{ gap: 8 }}>
              <View style={styles.branchHead}>
                <Ionicons name="location-outline" size={18} color={theme.primary} />
                <Text style={[type.label, { color: theme.text }]}>{b.country}</Text>
              </View>
              {b.address ? <Text style={[type.caption, { color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }]}>{b.address}</Text> : null}
              <View style={{ gap: 4 }}>
                {b.phones.map((p) => (
                  <Pressable key={p} style={styles.phoneRow} onPress={() => Linking.openURL(`tel:${p}`)} hitSlop={4}>
                    <Ionicons name="call-outline" size={14} color={theme.textMuted} />
                    <Text style={[type.caption, { color: theme.primaryDark }]}>{t("contact.phone", "Phone")}: {p}</Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          </FadeInView>
        ))}

        {/* Email card */}
        <FadeInView index={3}>
          <Pressable onPress={() => Linking.openURL(`mailto:${EMAIL}`)}>
            <Card style={styles.emailCard}>
              <Ionicons name="mail-outline" size={18} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[type.label, { color: theme.text, textAlign: isRTL ? "right" : "left" }]}>{t("contact.email", "Email")}</Text>
                <Text style={[type.caption, { color: theme.primaryDark, textAlign: isRTL ? "right" : "left" }]}>{EMAIL}</Text>
              </View>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={theme.textMuted} />
            </Card>
          </Pressable>
        </FadeInView>

        {/* Feedback form */}
        <FadeInView index={4} style={{ gap: 12 }}>
          <SectionHeader title={t("contact.getInTouch", "Get in Touch")} />
          {success ? <Banner type="success" message={success} /> : null}
          {error ? <Banner type="error" message={error} /> : null}
          <Field label={t("feedback.email", "Your Email")} value={form.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />
          <Field label={t("feedback.subject", "Subject")} value={form.subject} onChangeText={set("subject")} autoCapitalize="sentences" />
          <Field label={t("feedback.message", "Message")} value={form.message} onChangeText={set("message")} autoCapitalize="sentences" />
          <AppButton title={t("feedback.sendFeedback", "Send Feedback")} icon="send" loading={loading} disabled={!canSubmit} onPress={submit} />
        </FadeInView>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    header: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 8 },
    headerBack: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
    branchHead: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 },
    phoneRow: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 },
    emailCard: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 },
  });
