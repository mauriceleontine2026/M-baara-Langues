import { getLanguageByCode, getVocabularyForLanguage, getLessonsForLanguage } from "@/api/languageService";
import { updateProgress } from "@/api/progressService";

const PREFIX = "mbaara_offline_";

const getStorage = () => {
  if (typeof window === "undefined" || !window.localStorage) return null;
  return window.localStorage;
};

/**
 * @param {string} key
 * @param {any} data
 * @returns {boolean}
 */
export const saveOffline = (key, data) => {
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
    return true;
  } catch {
    return false;
  }
};

/**
 * @param {string} key
 * @returns {any}
 */
export const getOffline = (key) => {
  try {
    const storage = getStorage();
    if (!storage) return null;
    const raw = storage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw).data;
  } catch {
    return null;
  }
};

/**
 * @param {string} key
 */
export const removeOffline = (key) => {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(PREFIX + key);
};

/**
 * @param {string} key
 * @returns {boolean}
 */
export const isAvailableOffline = (key) => {
  const storage = getStorage();
  return storage ? storage.getItem(PREFIX + key) !== null : false;
};

// Download a language's content for offline use
/**
 * @param {string} langCode
 * @returns {Promise<{vocabCount:number,lessonCount:number}>}
 */
export const downloadLanguageOffline = async (langCode) => {
  const [vocab, lessons, language] = await Promise.all([
    getVocabularyForLanguage(langCode),
    getLessonsForLanguage(langCode),
    getLanguageByCode(langCode),
  ]);
  saveOffline(`vocab_${langCode}`, Array.isArray(vocab) ? vocab : []);
  saveOffline(`lessons_${langCode}`, Array.isArray(lessons) ? lessons : []);
  if (language) saveOffline(`lang_${langCode}`, language);
  return {
    vocabCount: Array.isArray(vocab) ? vocab.length : 0,
    lessonCount: Array.isArray(lessons) ? lessons.length : 0,
  };
};

/**
 * @param {string} langCode
 * @returns {boolean}
 */
export const isLanguageDownloaded = (langCode) => {
  return isAvailableOffline(`vocab_${langCode}`);
};

/**
 * @param {string} langCode
 * @returns {any[]}
 */
export const getOfflineVocab = (langCode) => {
  return getOffline(`vocab_${langCode}`) || [];
};

/**
 * @param {string} langCode
 * @returns {any[]}
 */
export const getOfflineLessons = (langCode) => {
  return getOffline(`lessons_${langCode}`) || [];
};

/**
 * @param {string} langCode
 * @returns {any}
 */
export const getOfflineLang = (langCode) => {
  return getOffline(`lang_${langCode}`);
};

/**
 * @returns {any[]}
 */
export const getOfflineLanguages = () => {
  const storage = getStorage();
  if (!storage) return [];

  return Object.keys(storage)
    .filter(k => k.startsWith(PREFIX + "lang_"))
    .map(k => {
      try {
        const raw = storage.getItem(k);
        if (!raw) return null;
        return JSON.parse(raw).data;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

/**
 * @returns {any[]}
 */
export const getAllOfflineVocab = () => {
  const storage = getStorage();
  if (!storage) return [];

  return Object.keys(storage)
    .filter(k => k.startsWith(PREFIX + "vocab_"))
    .flatMap(k => {
      try {
        const raw = storage.getItem(k);
        if (!raw) return [];
        return JSON.parse(raw).data || [];
      } catch {
        return [];
      }
    });
};

export const removeLanguageOffline = (langCode) => {
  removeOffline(`vocab_${langCode}`);
  removeOffline(`lessons_${langCode}`);
  removeOffline(`lang_${langCode}`);
};

// Progress queue for offline sync
/**
 * @param {Record<string, any>} update
 */
export const queueProgressUpdate = (update) => {
  const queue = getOffline("progress_queue") || [];
  queue.push({ ...update, timestamp: Date.now() });
  saveOffline("progress_queue", queue);
};

export const getProgressQueue = () => {
  return getOffline("progress_queue") || [];
};

export const clearProgressQueue = () => {
  removeOffline("progress_queue");
};

export const syncProgressQueue = async () => {
  const queue = getProgressQueue();
  if (queue.length === 0) return;

  const remaining = [];

  for (const item of queue) {
    try {
      if (item.type === "lesson_complete") {
        await updateProgress({
          type: item.type,
          language_code: item.language_code,
          lesson_number: item.lesson_number,
          xp: item.xp,
        });
      }
    } catch {
      remaining.push(item);
    }
  }

  if (remaining.length > 0) saveOffline("progress_queue", remaining);
  else clearProgressQueue();

  if (typeof window !== "undefined" && queue.length > 0 && remaining.length < queue.length) {
    window.dispatchEvent(new Event("mbaara-progress-updated"));
  }
};