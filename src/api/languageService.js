import { request } from "./backendClient";

const toArray = (value) => (Array.isArray(value) ? value : []);

export async function getLanguages() {
  try {
    const data = await request("GET", "/api/languages");
    return toArray(data);
  } catch (error) {
    console.error("Backend language fetch error:", error);
    return [];
  }
}

export async function getLanguageByCode(code) {
  if (!code) {
    return null;
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
