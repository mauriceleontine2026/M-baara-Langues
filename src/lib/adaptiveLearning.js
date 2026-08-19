const ADAPTIVE_PREFIX = "mbaara_adaptive_";

const getStorage = () => (typeof window !== "undefined" ? window.localStorage : null);

const getKey = (languageCode, exerciseKey) => `${ADAPTIVE_PREFIX}${languageCode}_${exerciseKey}`;

const readState = (languageCode, exerciseKey) => {
  try {
    const raw = getStorage()?.getItem(getKey(languageCode, exerciseKey));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeState = (languageCode, exerciseKey, state) => {
  try {
    getStorage()?.setItem(getKey(languageCode, exerciseKey), JSON.stringify(state));
  } catch {
    // Adaptive learning remains available in memory when storage is unavailable.
  }
};

const getExerciseId = (exercise, index) => String(exercise?.exercise_id || exercise?.id || `exercise-${index}`);

export const orderAdaptiveExercises = (exercises, languageCode, exerciseKey) => {
  const now = Date.now();
  return exercises
    .map((exercise, index) => {
      const id = getExerciseId(exercise, index);
      const state = readState(languageCode, `${exerciseKey}_${id}`);
      const accuracy = state.attempts ? state.correct / state.attempts : 0;
      const due = !state.nextReviewAt || Number(state.nextReviewAt) <= now;
      const priority = (due ? 100 : 0) + (1 - accuracy) * 40 + (state.streak ? 0 : 12) + (state.lastSeenAt ? 0 : 8);
      return { exercise, index, priority };
    })
    .sort((a, b) => b.priority - a.priority || a.index - b.index)
    .map(({ exercise }) => exercise);
};

export const recordAdaptiveAnswer = (languageCode, exerciseKey, exercise, passed, index = 0) => {
  const id = getExerciseId(exercise, index);
  const key = `${exerciseKey}_${id}`;
  const state = readState(languageCode, key);
  const attempts = Number(state.attempts || 0) + 1;
  const correct = Number(state.correct || 0) + (passed ? 1 : 0);
  const streak = passed ? Number(state.streak || 0) + 1 : 0;
  const intervalDays = passed ? Math.min(30, Math.max(1, 2 ** Math.min(streak, 4))) : 0;
  const nextReviewAt = Date.now() + intervalDays * 24 * 60 * 60 * 1000;
  const nextState = { attempts, correct, streak, lastPassed: passed, lastSeenAt: Date.now(), nextReviewAt };
  writeState(languageCode, key, nextState);
  return nextState;
};

export const getAdaptiveSummary = (exercises, languageCode, exerciseKey) => {
  const now = Date.now();
  let due = 0;
  let mastered = 0;
  exercises.forEach((exercise, index) => {
    const state = readState(languageCode, `${exerciseKey}_${getExerciseId(exercise, index)}`);
    if (!state.nextReviewAt || Number(state.nextReviewAt) <= now) due += 1;
    if (Number(state.streak || 0) >= 3 && state.attempts) mastered += 1;
  });
  return { due, mastered, total: exercises.length };
};
