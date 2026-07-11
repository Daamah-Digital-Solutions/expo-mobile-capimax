// Capimax Assistant chatbot — talks DIRECTLY to the AI webhook (a different host, no auth), so it
// deliberately does NOT go through the main axios client (which attaches the Bearer token + refresh
// logic for api.capimaxinvestment.com). Contract (owner-provided):
//   POST {chatUrl}  { action: "sendMessage", sessionId, chatInput }  ->  200 { output: "<reply>" }
// URL comes from app.json > expo.extra.chatUrl (never hardcoded). ~30s timeout; one retry on a
// network failure (no HTTP response), per the spec. Replies are English by design.
import axios from "axios";
import Constants from "expo-constants";

const CHAT_URL = Constants.expoConfig?.extra?.chatUrl;

export async function sendChatMessage({ sessionId, chatInput }) {
  if (!CHAT_URL) throw new Error("Missing expo.extra.chatUrl");
  const body = { action: "sendMessage", sessionId, chatInput };
  const config = { headers: { "Content-Type": "application/json" }, timeout: 30000 };
  try {
    const res = await axios.post(CHAT_URL, body, config);
    return res?.data?.output ?? "";
  } catch (err) {
    // Retry once ONLY on a network failure (no response received); surface HTTP errors as-is.
    if (!err?.response) {
      const res = await axios.post(CHAT_URL, body, config);
      return res?.data?.output ?? "";
    }
    throw err;
  }
}
