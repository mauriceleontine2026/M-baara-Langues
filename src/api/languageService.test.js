import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getLanguages, getLanguageByCode, getVocabularyForLanguage, getVocabularyForLesson, getLessonsForLanguage, getAllVocabulary, getAllLessons } from './languageService';

const mockRequest = vi.fn();

vi.mock('./backendClient', () => ({
  request: (...args) => mockRequest(...args),
}));

describe('languageService backend integration', () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches languages from the backend', async () => {
    mockRequest.mockResolvedValue([{ code: 'fr', name: 'Français' }]);

    const result = await getLanguages();

    expect(mockRequest).toHaveBeenCalledWith('GET', '/api/languages');
    expect(result).toEqual([{ code: 'fr', name: 'Français' }]);
  });

  it('fetches vocabulary by lesson from the backend', async () => {
    mockRequest.mockResolvedValue([{ word: 'bonjour', lesson_number: 1 }]);

    const result = await getVocabularyForLesson('fr', 1);

    expect(mockRequest).toHaveBeenCalledWith('GET', '/api/vocabulary', undefined, { language_code: 'fr', lesson_number: 1 });
    expect(result).toEqual([{ word: 'bonjour', lesson_number: 1 }]);
  });
});
