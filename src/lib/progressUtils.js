export function getNextUnlockedLesson(completedLessons, availableLessons) {
  const completed = [...new Set((Array.isArray(completedLessons) ? completedLessons : [])
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0))]
    .sort((a, b) => a - b);

  const available = Array.isArray(availableLessons) && availableLessons.length > 0
    ? [...new Set(availableLessons
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0))].sort((a, b) => a - b)
    : null;

  if (available) {
    const completedSet = new Set(completed);
    for (const lesson of available) {
      if (!completedSet.has(lesson)) {
        return lesson;
      }
    }
    return available[available.length - 1];
  }

  let nextLesson = 1;
  for (const lesson of completed) {
    if (lesson === nextLesson) {
      nextLesson += 1;
    } else if (lesson > nextLesson) {
      break;
    }
  }

  return nextLesson;
}

export function buildLessonProgressTree(lessonItems, completedLessons) {
  const lessonNumbers = [...new Set((Array.isArray(lessonItems) ? lessonItems : [])
    .map((item) => {
      if (typeof item === "number") return item;
      if (item && typeof item.lesson_number !== "undefined") return Number(item.lesson_number);
      return NaN;
    })
    .filter((item) => Number.isFinite(item) && item > 0))]
    .sort((a, b) => a - b);

  const completedSet = new Set((Array.isArray(completedLessons) ? completedLessons : [])
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0));

  const nextUnlockedLesson = getNextUnlockedLesson(completedLessons, lessonNumbers);

  return lessonNumbers.map((lesson_number, index) => {
    const completed = completedSet.has(lesson_number);
    const unlocked = completed || lesson_number === nextUnlockedLesson;
    const status = completed ? "completed" : unlocked ? "unlocked" : "locked";
    return {
      lesson_number,
      completed,
      unlocked,
      status,
      previous_lesson: index > 0 ? lessonNumbers[index - 1] : null,
      next_lesson: index < lessonNumbers.length - 1 ? lessonNumbers[index + 1] : null,
      is_next_available: lesson_number === nextUnlockedLesson,
    };
  });
}
