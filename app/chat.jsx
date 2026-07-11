// Capimax Assistant — live AI chat (client-provided webhook, src/api/chatService.js). Bubble UI with
// a persisted session id (context kept server-side, last 12 messages) + a locally-cached transcript,
// typing indicator, tap-to-retry on failure, and a "new chat" reset. Both themes + RTL. Bot replies
// are English by design; the UI chrome is localized.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../src/components/Screen";
import { useTheme } from "../src/context/ThemeContext";
import { useLanguage } from "../src/context/LanguageContext";
import { sendChatMessage } from "../src/api/chatService";
import { getChatSessionId, resetChatSession, loadChatMessages, saveChatMessages } from "../src/utils/chatSession";

let seq = 0;
const nextId = () => `${Date.now()}_${seq++}`;

export default function ChatScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, radii, type, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, radii, isRTL), [theme, radii, isRTL]);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const sessionRef = useRef(null);
  const scrollRef = useRef(null);
  const lastUserRef = useRef("");

  useEffect(() => {
    (async () => {
      sessionRef.current = await getChatSessionId();
      const saved = await loadChatMessages();
      if (saved.length) setMessages(saved);
    })();
  }, []);

  useEffect(() => {
    if (messages.length) saveChatMessages(messages);
  }, [messages]);

  const scrollToEnd = () => requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

  const doSend = async (text) => {
    const chatInput = (text || "").trim();
    if (!chatInput || sending) return;
    lastUserRef.current = chatInput;
    setMessages((prev) => [...prev.filter((m) => m.role !== "error"), { id: nextId(), role: "user", text: chatInput }]);
    setInput("");
    setSending(true);
    scrollToEnd();
    try {
      if (!sessionRef.current) sessionRef.current = await getChatSessionId();
      const output = await sendChatMessage({ sessionId: sessionRef.current, chatInput });
      const reply = String(output || "").trim();
      setMessages((prev) => [...prev, { id: nextId(), role: "bot", text: reply || t("chat.emptyReply", "…") }]);
    } catch (e) {
      setMessages((prev) => [...prev, { id: nextId(), role: "error", text: t("chat.error", "Couldn't reach the assistant. Tap to retry.") }]);
    } finally {
      setSending(false);
      scrollToEnd();
    }
  };

  const onRetry = () => {
    if (lastUserRef.current && !sending) doSend(lastUserRef.current);
  };

  const onNewChat = () => {
    if (!messages.length) return;
    Alert.alert(
      t("chat.newChat", "New chat"),
      t("chat.newChatConfirm", "Start a new conversation? This clears the current chat."),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        {
          text: t("chat.newChat", "New chat"),
          style: "destructive",
          onPress: async () => {
            sessionRef.current = await resetChatSession();
            setMessages([]);
            setInput("");
          },
        },
      ]
    );
  };

  const canSend = !!input.trim() && !sending;

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <Pressable style={styles.headerBtn} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color={theme.text} />
      </Pressable>
      <View style={styles.headerTitleWrap}>
        <View style={styles.headerAvatar}><Ionicons name="sparkles" size={14} color={theme.onPrimary} /></View>
        <Text style={[type.label, { color: theme.text }]}>{t("chat.title", "Capimax Assistant")}</Text>
      </View>
      <Pressable style={styles.headerBtn} onPress={onNewChat} hitSlop={8}>
        <Ionicons name="create-outline" size={20} color={messages.length ? theme.textSecondary : theme.textMuted} />
      </Pressable>
    </View>
  );

  return (
    <Screen edges={["bottom"]}>
      {Header}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 12, gap: 10, flexGrow: 1 }}
          onContentSizeChange={scrollToEnd}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.welcome}>
              <View style={styles.welcomeAvatar}><Ionicons name="sparkles" size={26} color={theme.onPrimary} /></View>
              <Text style={[type.h2, { color: theme.text, textAlign: "center" }]}>{t("chat.welcomeTitle", "Capimax Assistant")}</Text>
              <Text style={[type.body, { color: theme.textSecondary, textAlign: "center", lineHeight: 22 }]}>
                {t("chat.welcomeBody", "Ask me anything about Capimax — assets, investing, payments, and more.")}
              </Text>
            </View>
          ) : (
            messages.map((m) => <Bubble key={m.id} m={m} onRetry={onRetry} styles={styles} theme={theme} type={type} />)
          )}
          {sending ? (
            <View style={[styles.bubble, styles.botBubble, styles.typing]}>
              <ActivityIndicator size="small" color={theme.textSecondary} />
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t("chat.placeholder", "Type a message…")}
            placeholderTextColor={theme.textMuted}
            multiline
            maxLength={2000}
            editable={!sending}
          />
          <Pressable style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]} onPress={() => doSend(input)} disabled={!canSend}>
            <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={20} color={theme.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Bubble({ m, onRetry, styles, theme, type }) {
  if (m.role === "error") {
    return (
      <Pressable onPress={onRetry} style={[styles.bubble, styles.errorBubble]}>
        <Ionicons name="alert-circle-outline" size={16} color={theme.error} />
        <Text style={[type.caption, { color: theme.error, flexShrink: 1 }]}>{m.text}</Text>
      </Pressable>
    );
  }
  const isUser = m.role === "user";
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
      <Text style={[type.body, { color: isUser ? theme.onPrimary : theme.text, lineHeight: 21 }]}>{m.text}</Text>
    </View>
  );
}

const makeStyles = (theme, radii, isRTL) =>
  StyleSheet.create({
    header: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingBottom: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    headerBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
    headerTitleWrap: { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 },
    headerAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center" },

    welcome: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 16 },
    welcomeAvatar: { width: 66, height: 66, borderRadius: 22, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center", marginBottom: 4 },

    bubble: { maxWidth: "84%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
    userBubble: { alignSelf: "flex-end", backgroundColor: theme.primary },
    botBubble: { alignSelf: "flex-start", backgroundColor: theme.surfaceAlt },
    typing: { paddingVertical: 14, paddingHorizontal: 18 },
    errorBubble: {
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.error + "18",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.error + "40",
    },

    inputBar: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "flex-end",
      gap: 8,
      paddingHorizontal: 14,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
      backgroundColor: theme.surface,
    },
    input: {
      flex: 1,
      maxHeight: 120,
      minHeight: 44,
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === "ios" ? 12 : 8,
      backgroundColor: theme.surfaceAlt,
      color: theme.text,
      fontSize: 15,
      textAlign: isRTL ? "right" : "left",
    },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center" },
    sendBtnDisabled: { opacity: 0.4 },
  });
