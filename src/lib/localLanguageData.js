// Thin wrapper re-exporting the lazy local language data implementation.
export {
  isLocalLanguage,
  getLocalLanguages,
  getLocalLanguage,
  getLocalLanguage as getLocalLanguageMeta,
  getLocalCurriculum as getCurriculumForLanguage,
  getLocalLessons,
  getLocalLessons as getLessonMetadataForLanguage,
  getVocabularyForLanguage,
  getVocabularyForLesson,
} from "./localLanguageDataLazy";
// Backwards-compatible default export (if any consumers import default)
export { getLocalCurriculum as default } from "./localLanguageDataLazy";
