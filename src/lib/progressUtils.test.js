import { describe, expect, it } from 'vitest';
import { buildLessonProgressTree, getNextUnlockedLesson } from './progressUtils';

describe('getNextUnlockedLesson', () => {
  it('returns the next lesson after consecutive completions', () => {
    expect(getNextUnlockedLesson([1, 2])).toBe(3);
  });

  it('stops at the first missing lesson in the sequence', () => {
    expect(getNextUnlockedLesson([1, 3])).toBe(2);
  });

  it('returns the next existing lesson when an intermediate lesson number is missing', () => {
    expect(getNextUnlockedLesson([1, 2], [1, 2, 4])).toBe(4);
  });
});

describe('buildLessonProgressTree', () => {
  it('builds a sequential lesson tree with locked, unlocked, and completed states', () => {
    const tree = buildLessonProgressTree([1, 2, 3, 4], [1, 3]);
    expect(tree).toEqual([
      { lesson_number: 1, completed: true, unlocked: true, status: 'completed', previous_lesson: null, next_lesson: 2, is_next_available: false },
      { lesson_number: 2, completed: false, unlocked: true, status: 'unlocked', previous_lesson: 1, next_lesson: 3, is_next_available: true },
      { lesson_number: 3, completed: true, unlocked: true, status: 'completed', previous_lesson: 2, next_lesson: 4, is_next_available: false },
      { lesson_number: 4, completed: false, unlocked: false, status: 'locked', previous_lesson: 3, next_lesson: null, is_next_available: false },
    ]);
  });
});
