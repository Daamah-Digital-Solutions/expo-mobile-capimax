// Chat session helpers for the Capimax Assistant. The bot keeps context server-side keyed by
// `sessionId` (memory window = last 12 messages), so we generate ONE id per install and persist it,
// reusing it across the whole conversation. "New chat" mints a fresh id (clears server context).
// The transcript is also cached locally so the history shows when the user reopens the screen.
// sessionId is non-sensitive → AsyncStorage (not secure-store).
import AsyncStorage from "@react-native-async-storage/async-storage";

const ID_KEY = "chat.sessionId";
const MSG_KEY = "chat.messages";

// UUID v4 (Math.random is fine here — this id is a conversation key, not a secret).
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getChatSessionId() {
  let id = await AsyncStorage.getItem(ID_KEY);
  if (!id) {
    id = uuidv4();
    await AsyncStorage.setItem(ID_KEY, id);
  }
  return id;
}

// Start a brand-new conversation: fresh session id + clear the cached transcript.
export async function resetChatSession() {
  const id = uuidv4();
  await AsyncStorage.setItem(ID_KEY, id);
  await AsyncStorage.removeItem(MSG_KEY);
  return id;
}

export async function loadChatMessages() {
  try {
    const raw = await AsyncStorage.getItem(MSG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveChatMessages(messages) {
  try {
    // cache the tail only (keep storage small); drop transient error bubbles.
    const keep = messages.filter((m) => m.role !== "error").slice(-60);
    await AsyncStorage.setItem(MSG_KEY, JSON.stringify(keep));
  } catch {}
}
