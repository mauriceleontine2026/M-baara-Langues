import { request } from "./backendClient";
import {
  initializeLocalLanguageData,
  isLocalLanguage,
  getLocalLanguages,
  getLocalLanguage,
  getLocalLessons,
  getVocabularyForLanguage as getLocalVocabularyForLanguage,
  getVocabularyForLesson as getLocalVocabularyForLesson,
} from "@/lib/localLanguageData";

const toArray = (value) => (Array.isArray(value) ? value : []);

const mergeUniqueLanguages = (languages) => {
  const items = Array.isArray(languages) ? languages.slice() : [];
  const existingCodes = new Set(items.map((lang) => String(lang?.code || "").trim().toLowerCase()));
  getLocalLanguages().forEach((localLang) => {
    const localCode = String(localLang?.code || "").trim().toLowerCase();
    if (localCode && !existingCodes.has(localCode)) {
      items.push(localLang);
      existingCodes.add(localCode);
    }
  });
  return items;
};

export async function getLanguages() {
  return getLocalLanguages();
}

export async function getLanguageByCode(code) {
  if (!code) {
    return null;
  }

  if (isLocalLanguage(code)) {
    return getLocalLanguage(code);
  }

  try {
    return await request("GET", `/api/languages/${encodeURIComponent(code)}`);
  } catch (error) {
    console.error("Backend language fetch error:", error);
    return null;
  }
}

export async function getVocabularyForLanguage(languageCode) {
  if (!languageCode) {
    return [];
  }

  if (isLocalLanguage(languageCode)) {
    await initializeLocalLanguageData();
    return getLocalVocabularyForLanguage(languageCode);
  }

  const candidates = [String(languageCode).trim(), String(languageCode).trim().toLowerCase(), String(languageCode).trim().replace(/français/g, "francais").replace(/français/g, "francais")];
  const uniqueCandidates = [...new Set(candidates.filter(Boolean))];

  try {
    const data = await request("GET", "/api/vocabulary", undefined, { language_code: languageCode });
    const items = toArray(data);
    if (items.length > 0) return items;

    const fallbackData = await request("GET", "/api/vocabulary");
    const allItems = toArray(fallbackData);
    return allItems.filter((item) => uniqueCandidates.includes(String(item.language_code || "")) || uniqueCandidates.some((candidate) => String(item.language_code || "").toLowerCase() === candidate.toLowerCase()));
  } catch (error) {
    console.error("Backend vocabulary fetch error:", error);
    return [];
  }
}

export async function getVocabularyForLesson(languageCode, lessonNumber) {
  if (!languageCode || lessonNumber == null) {
    return [];
  }

  if (isLocalLanguage(languageCode)) {
    await initializeLocalLanguageData();
    return getLocalVocabularyForLesson(languageCode, lessonNumber);
  }

  try {
    const data = await request("GET", "/api/vocabulary", undefined, { language_code: languageCode, lesson_number: lessonNumber });
    return toArray(data);
  } catch (error) {
    console.error("Backend vocabulary fetch error:", error);
    return [];
  }
}

export async function getLessonsForLanguage(languageCode) {
  if (!languageCode) {
    return [];
  }

  if (isLocalLanguage(languageCode)) {
    await initializeLocalLanguageData();
    return getLocalLessons(languageCode);
  }

  try {
    const data = await request("GET", "/api/lessons", undefined, { language_code: languageCode });
    return toArray(data);
  } catch (error) {
    console.error("Backend lessons fetch error:", error);
    return [];
  }
}

export async function getAllVocabulary() {
  try {
    const data = await request("GET", "/api/vocabulary");
    return toArray(data);
  } catch (error) {
    console.error("Backend vocabulary fetch error:", error);
    return [];
  }
}

export async function getAllLessons() {
  try {
    const data = await request("GET", "/api/lessons");
    return toArray(data);
  } catch (error) {
    console.error("Backend lessons fetch error:", error);
    return [];
  }
}

export async function createLanguage(payload) {
  return await request("POST", "/api/languages", payload);
}

export async function createLesson(payload) {
  return await request("POST", "/api/lessons", payload);
}

export async function updateLesson(id, payload) {
  return await request("PUT", `/api/lessons/${id}`, payload);
}

export async function createVocabulary(payload) {
  return await request("POST", "/api/vocabulary", payload);
}

export async function updateVocabulary(id, payload) {
  return await request("PUT", `/api/vocabulary/${id}`, payload);
}

export async function deleteVocabulary(id) {
  return await request("DELETE", `/api/vocabulary/${id}`);
}
