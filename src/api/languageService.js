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

  try {
    const data = await request("GET", "/api/vocabulary", undefined, { language_code: languageCode });
    return toArray(data);
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
    const data = await request("GET", "/api/lessons");
    const lessons = toArray(data);
    const normalizedCode = String(languageCode).toLowerCase();
    return lessons.filter((lesson) => {
      const lessonCode = String(lesson.language_code || "").toLowerCase();
      return lessonCode === normalizedCode || lessonCode === normalizedCode.replace(/francais/g, "fr").replace(/anglais/g, "en");
    });
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
