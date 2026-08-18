import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';import { getLocalLanguages } from '@/lib/localLanguageData';import { getLanguages, getLanguageByCode, getVocabularyForLanguage, getVocabularyForLesson, getLessonsForLanguage, getAllVocabulary, getAllLessons } from './languageService';

const mockRequest = vi.fn();

vi.mock('./backendClient', () => ({
  request: (...args) => mockRequest(...args),
}));

describe('languageService local language data', () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns all local languages without a backend request', async () => {
    const result = await getLanguages();

    expect(mockRequest).not.toHaveBeenCalled();
    expect(result).toHaveLength(39);
  });

  it('loads lessons and vocabulary from the local language data', async () => {
    const lessons = await getLessonsForLanguage('malinke');
    const vocabulary = await getVocabularyForLanguage('malinke');

    expect(lessons.length).toBeGreaterThan(0);
    expect(vocabulary.length).toBeGreaterThan(0);
    expect(lessons[0].title_fr).toBeTruthy();
    expect(Array.isArray(lessons[0].learning_objectives)).toBe(true);
    expect(Array.isArray(lessons[0].common_phrases)).toBe(true);

    const languages = await getLanguages();
    const lessonCounts = await Promise.all(
      languages.map(async (language) => (await getLessonsForLanguage(language.code)).length)
    );
    expect(lessonCounts).toHaveLength(39);
    expect(lessonCounts.every((count) => count > 0)).toBe(true);
  });

  it('includes Guinean languages from the local data folders', () => {
    const languages = getLocalLanguages();

    expect(languages.some((lang) => lang.code === 'malinke')).toBe(true);
    expect(languages.some((lang) => lang.code === 'pular')).toBe(true);
    expect(languages.some((lang) => lang.code === 'guerze')).toBe(true);
    expect(languages.length).toBeGreaterThan(18);
  });

  it('fetches vocabulary by lesson from the backend', async () => {
    mockRequest.mockResolvedValue([{ word: 'bonjour', lesson_number: 1 }]);

    const result = await getVocabularyForLesson('fr', 1);

    expect(mockRequest).toHaveBeenCalledWith('GET', '/api/vocabulary', undefined, { language_code: 'fr', lesson_number: 1 });
    expect(result).toEqual([{ word: 'bonjour', lesson_number: 1 }]);
  });
});
