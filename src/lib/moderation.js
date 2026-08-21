// Content moderation for Mǎa-kwɛ́lî
// First-pass filter for inappropriate content in contributions and chat

const INAPPROPRIATE_WORDS = [
  // French
  "connard", "connasse", "salope", "putain", "merde", "encule", "enculé",
  "bâtard", "nègre", "négro", "macaque", "bougnoul", "raton", "pédale",
  "mince", "con ", "salop",
  // English
  "fuck", "shit", "bitch", "asshole", "nigger", "nigga", "retard", "cunt",
  // Hate / violence
  "terrorist", "bomb", "kill yourself", "suicide",
];

export function moderateContent(text) {
  if (!text) return { ok: true };
  const lower = " " + text.toLowerCase() + " ";
  const found = INAPPROPRIATE_WORDS.find(w => lower.includes(w));
  if (found) {
    return { ok: false, reason: "inappropriate", word: found.trim() };
  }
  return { ok: true };
}

export function getModerationMessage(reason) {
  if (reason === "inappropriate") {
    return "⚠️ Ce message contient du contenu inapproprié. Mǎa-kwɛ́lî est une plateforme d'apprentissage respectueuse. Merci de reformuler ton message.";
  }
  return "⚠️ Message bloqué par la modération automatique.";
}