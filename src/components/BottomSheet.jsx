// BottomSheet (DESIGN.md §7) — radius-28 top, drag handle, backdrop fade, slides up.
import React, { useMemo } from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

export default function BottomSheet({ visible, onClose, title, children }) {
  const { theme, radii, type } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, radii), [theme, radii]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={StyleSheet.absoluteFill}>
          <Pressable style={styles.backdrop} onPress={onClose} />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.duration(280)}
          exiting={SlideOutDown.duration(220)}
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.handle} />
          {title ? <Text style={[type.h2, styles.title]}>{title}</Text> : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const makeStyles = (theme, radii) =>
  StyleSheet.create({
    root: { flex: 1, justifyContent: "flex-end" },
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
    sheet: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: radii.sheet,
      borderTopRightRadius: radii.sheet,
      paddingHorizontal: 20,
      paddingTop: 12,
      gap: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.borderStrong,
      marginBottom: 6,
    },
    title: { color: theme.text },
  });
