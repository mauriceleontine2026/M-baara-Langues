import lessonCurriculum from "@/data/lessonCurriculum";
import { isLocalLanguage } from "@/lib/localLanguageDataLazy";

const normalizeText = (value) => String(value || "").trim().toLowerCase();

// Synchronous fallback used by components that expect immediate curriculum data.
export const getCurriculumForLanguageSync = (langCode) => {
  if (isLocalLanguage(langCode)) return { levels: [] };
  return lessonCurriculum;
};

// Async loader for local languages (lazy-loads large JSON parsing code).
export const getCurriculumForLanguageAsync = async (langCode) => {
  if (!langCode) return { levels: [] };
  if (isLocalLanguage(langCode)) {
    const mod = await import("@/lib/localLanguageDataLazy");
    return await mod.getLocalCurriculum(langCode);
  }
  return lessonCurriculum;
};

export const getCurriculumForLanguageExport = getCurriculumForLanguageSync;

const getModuleFromCurriculum = (curriculum, moduleId) => {
  if (!curriculum || !Array.isArray(curriculum.levels)) return null;
  for (let levelIndex = 0; levelIndex < curriculum.levels.length; levelIndex += 1) {
    const level = curriculum.levels[levelIndex];
    for (let moduleIndex = 0; moduleIndex < level.modules.length; moduleIndex += 1) {
      const module = level.modules[moduleIndex];
      if (module.id === moduleId) return { level, module, levelIndex, moduleIndex };
    }
  }
  return null;
};

export const getModuleById = (moduleId, langCode, curriculum = null) => {
  const curriculumData = curriculum || getCurriculumForLanguageSync(langCode);
  return getModuleFromCurriculum(curriculumData, moduleId);
};

export const findModuleByLessonNumber = (lessonNumber, niveauLabel = "", langCode, curriculum = null) => {
  const lessonNum = Number(lessonNumber);
  if (!Number.isFinite(lessonNum) || lessonNum <= 0) return null;

  const curriculumData = curriculum || getCurriculumForLanguageSync(langCode);
  const normalizedNiveau = normalizeText(niveauLabel);
  const candidates = normalizedNiveau
    ? curriculumData.levels.filter(
        (level) =>
          normalizeText(level.label).includes(normalizedNiveau) ||
          normalizeText(level.id).includes(normalizedNiveau.replace(/é/g, "e"))
      )
    : curriculumData.levels;

  for (let levelIndex = 0; levelIndex < candidates.length; levelIndex += 1) {
    const level = candidates[levelIndex];
    for (let moduleIndex = 0; moduleIndex < level.modules.length; moduleIndex += 1) {
      const module = level.modules[moduleIndex];
      if (module.lessons.map((lesson) => Number(lesson.lesson_number)).includes(lessonNum)) return { level, module, levelIndex, moduleIndex };
    }
  }

  for (let levelIndex = 0; levelIndex < curriculumData.levels.length; levelIndex += 1) {
    const level = curriculumData.levels[levelIndex];
    for (let moduleIndex = 0; moduleIndex < level.modules.length; moduleIndex += 1) {
      const module = level.modules[moduleIndex];
      if (module.lessons.map((lesson) => Number(lesson.lesson_number)).includes(lessonNum)) return { level, module, levelIndex, moduleIndex };
    }
  }

  return null;
};

export const getModuleLessonNumbers = (module) => {
  return Array.isArray(module?.lessons) ? module.lessons.map((l) => Number(l.lesson_number)).filter((n) => Number.isFinite(n) && n > 0) : [];
};

export const getModuleCompletionState = (module, completedLessons, exerciseRecords = {}) => {
  const lessonNumbers = getModuleLessonNumbers(module);
  const moduleLessonsDone = lessonNumbers.length > 0 && lessonNumbers.every((n) => completedLessons.includes(n));
  const exerciseRecord = exerciseRecords[module.id] || {};
  const exerciseScore = Number(exerciseRecord?.score || 0);
  const exerciseCompleted = Boolean(exerciseRecord?.completed);
  const exercisePass = exerciseCompleted && exerciseScore >= 70;

  return { moduleLessonsDone, exerciseScore, exerciseCompleted, exercisePass };
};

export const getBeginnerCompletionStatus = (completedLessons, exerciseRecords = {}, minimumAverageScore = 70, langCode, curriculum = null) => {
  const curriculumData = curriculum || getCurriculumForLanguageSync(langCode);
  const beginnerLevel = curriculumData.levels.find((level) => level.id === "niveau-debutant");
  if (!beginnerLevel) return { complete: false, averageScore: 0, allModulesPassed: false, allLessonsDone: false };

  const moduleStates = beginnerLevel.modules.map((module) => getModuleCompletionState(module, completedLessons, exerciseRecords));
  const allModulesPassed = moduleStates.every((s) => s.moduleLessonsDone && s.exercisePass);
  const averageScore = moduleStates.length > 0 ? Math.round(moduleStates.reduce((sum, s) => sum + s.exerciseScore, 0) / moduleStates.length) : 0;
  const allLessonsDone = beginnerLevel.modules.every((module) => getModuleLessonNumbers(module).every((n) => completedLessons.includes(n)));

  return { complete: allModulesPassed && allLessonsDone && averageScore >= minimumAverageScore, averageScore, allModulesPassed, allLessonsDone };
};

export const getAvailableState = (levelIndex, moduleIndex, level, module, completedLessons, exerciseRecords = {}, langCode, curriculum = null) => {
  const lessonNumbers = getModuleLessonNumbers(module);
  const moduleLessonsDone = lessonNumbers.length > 0 && lessonNumbers.every((n) => completedLessons.includes(n));
  const exerciseRecord = exerciseRecords[module.id] || {};
  const exerciseScore = Number(exerciseRecord?.score || 0);
  const exerciseCompleted = Boolean(exerciseRecord?.completed);
  const exercisePass = exerciseCompleted && exerciseScore >= 70;

  const available = moduleIndex === 0 || (levelIndex === 0 && levelIndex !== null) || Boolean(moduleLessonsDone) || Boolean(exercisePass);

  return { available, moduleLessonsDone, exerciseScore, exercisePassed: exercisePass, lessonCount: lessonNumbers.length, moduleId: module.id };
};

export const getLockMessageForModule = (levelIndex, moduleIndex, level, isBeginnerComplete) => {
  if (levelIndex === 0) return "Ce module est disponible.";
  if (!isBeginnerComplete) return "Ce module est verrouillé tant que le niveau Débutant n'est pas achevé avec tous les exercices validés.";
  return "Ce module est bloqué par les conditions de progression du curriculum.";
};

export const isLessonAccessible = (lessonNumber, niveauLabel, completedLessons, exerciseRecords = {}, langCode, curriculum = null) => {
  const found = findModuleByLessonNumber(lessonNumber, niveauLabel, langCode, curriculum);
  if (!found) return true;
  const { levelIndex, moduleIndex, level, module } = found;
  return getAvailableState(levelIndex, moduleIndex, level, module, completedLessons, exerciseRecords, langCode, curriculum).available;
};

export const isModuleAccessible = (moduleId, completedLessons, exerciseRecords = {}, langCode, curriculum = null) => {
  const found = getModuleById(moduleId, langCode, curriculum);
  if (!found) return true;
  const { levelIndex, moduleIndex, level, module } = found;
  return getAvailableState(levelIndex, moduleIndex, level, module, completedLessons, exerciseRecords, langCode, curriculum).available;
};
