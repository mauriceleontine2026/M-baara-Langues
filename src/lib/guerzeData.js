const locale = "fr-FR";

const GUERZE_LANGUAGE = {
  code: "guerze",
  name: "Guerzé (Kpelé)",
  name_fr: "Guerzé",
  region: "Guinée Forestière",
  family: "Mandé",
  status: "active",
  flag_emoji: "🇬🇳",
  color: "#7B3E8A",
  description: "Langue Guerzé (kpelé) de Guinée Forestière",
};

const LEVEL_META = {
  "Débutant": { id: "niveau-debutant", label: "Débutant", range: "A1 - A2" },
  "Intermédiaire": { id: "niveau-intermediaire", label: "Intermédiaire", range: "B1 - B2" },
  "Avancé": { id: "niveau-avance", label: "Avancé", range: "C1 - C2" },
};

const files = import.meta.glob("../data_langues/Guinée/Forestières/Guerzé/**/*.{json,JSON}", { eager: true, query: "?raw", import: "default" });
const rawLessons = Object.entries(files)
  .map(([filePath, module]) => {
    const content = module?.default ?? module;
    return { filePath, content };
  })
  .filter(({ content }) => content && typeof content === "object");

const normalizeLevelLabel = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (raw.includes("débutant") || raw.includes("a1") || raw.includes("a2")) return "Débutant";
  if (raw.includes("intermédiaire") || raw.includes("b1") || raw.includes("b2")) return "Intermédiaire";
  if (raw.includes("avancé") || raw.includes("c1") || raw.includes("c2")) return "Avancé";
  if (raw.includes("debutant")) return "Débutant";
  if (raw.includes("intermediaire")) return "Intermédiaire";
  if (raw.includes("avance")) return "Avancé";
  return String(value || "Débutant").trim();
};

const parseLevelMeta = (value) => {
  const raw = String(value || "").trim();
  const match = raw.match(/^(.+?)\s*\(([^)]+)\)/);
  const label = match ? match[1].trim() : raw;
  const range = match ? match[2].trim() : "";
  const normalized = normalizeLevelLabel(label);
  const meta = LEVEL_META[normalized] || { id: `niveau-${normalized.toLowerCase()}`, label: normalized, range };
  return { ...meta, range: range || meta.range };
};

const parseLessonOrder = (filePath, title) => {
  const candidate = String(filePath || "") + " " + String(title || "");
  const match = candidate.match(/Le[çc]on[\s_\-]*([0-9]+)/i);
  if (match) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  const numberMatch = candidate.match(/([0-9]{1,2})/);
  if (numberMatch) {
    const parsed = Number(numberMatch[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return 1;
};

const getPathSegments = (filePath) => String(filePath || "").split(/[\\/]/).filter(Boolean);

const getModuleInfoFromPath = (filePath) => {
  const segments = getPathSegments(filePath);
  const moduleSegment = segments[segments.length - 2] || "";
  const levelSegment = segments[segments.length - 3] || "";

  const moduleMatch = String(moduleSegment || "").match(/Module\s*([0-9]+)\s*(.*)$/i);
  const moduleNumber = moduleMatch ? Number(moduleMatch[1]) : 0;
  const moduleTitle = moduleMatch?.[2]?.trim() || "";
  const levelTitle = String(levelSegment || "").replace(/^Niveau\s+/i, "").trim();

  return { moduleNumber, moduleTitle, levelTitle };
};

const getModuleTitle = (moduleData, filePath) => {
  const { moduleTitle } = getModuleInfoFromPath(filePath);
  if (moduleTitle) return moduleTitle;
  if (moduleData?.titre_module) return String(moduleData.titre_module).trim();
  const match = String(filePath || "").match(/Module\s*([0-9]+)/i);
  if (match) return `Module ${match[1]}`;
  return "Module";
};

const buildCurriculum = () => {
  const levelMap = new Map();

  rawLessons.forEach(({ filePath, content }) => {
    const moduleData = Array.isArray(content.modules) ? content.modules[0] : content.modules;
    if (!moduleData || typeof moduleData !== "object") return;

    const { moduleNumber, levelTitle } = getModuleInfoFromPath(filePath);
    const levelInfo = parseLevelMeta(content.niveau || content.level || levelTitle || "Débutant");
    const levelKey = levelInfo.label;
    const moduleIdNumber = moduleNumber > 0 ? moduleNumber : Number(moduleData.id_module) || 0;
    const moduleLabel = getModuleTitle(moduleData, filePath);
    const lessonOrder = parseLessonOrder(filePath, content.titre_cours || content.titre_cour || content.title || "Leçon 1");
    const lessonTitle = String(content.titre_cours || content.titre_cour || content.title || `Leçon ${lessonOrder}`).trim();
    const chapters = Array.isArray(moduleData.chapitres) ? moduleData.chapitres : [];

    if (!levelMap.has(levelKey)) {
      levelMap.set(levelKey, {
        meta: levelInfo,
        modules: new Map(),
      });
    }

    const levelEntry = levelMap.get(levelKey);
    const moduleKey = String(moduleIdNumber);
    if (!levelEntry.modules.has(moduleKey)) {
      levelEntry.modules.set(moduleKey, {
        id: `${levelInfo.id}-module-${moduleIdNumber}`,
        label: `Module ${moduleIdNumber} : ${moduleLabel}`,
        rawTitle: moduleLabel,
        lessons: [],
        exerciseSeries: [],
        moduleData,
      });
    }

    const moduleEntry = levelEntry.modules.get(moduleKey);
    moduleEntry.lessons.push({
      filePath,
      lessonOrder,
      title: lessonTitle,
      title_fr: lessonTitle,
      introduction: String(content.introduction || "").trim(),
      chapitres: chapters,
      content: {
        vocabulary: Array.isArray(chapters)
          ? chapters.flatMap((chapter) => Array.isArray(chapter.vocabulaire_cles) ? chapter.vocabulaire_cles.map((v) => ({ word: v.terme, translation_fr: v.traduction_ou_definition })) : [])
          : [],
        exercises: Array.isArray(chapters)
          ? chapters.flatMap((chapter) => Array.isArray(chapter.exercices) ? chapter.exercices : [])
          : [],
        examples: Array.isArray(chapters)
          ? chapters.flatMap((chapter) => Array.isArray(chapter.exemples) ? chapter.exemples : [])
          : [],
      },
    });
  });

  const levels = [...levelMap.values()]
    .sort((a, b) => {
      const orderA = Object.keys(LEVEL_META).indexOf(a.meta.label);
      const orderB = Object.keys(LEVEL_META).indexOf(b.meta.label);
      return orderA - orderB;
    })
    .map((levelEntry) => {
      const sortedModules = [...levelEntry.modules.values()].sort((a, b) => {
        const aNum = Number(a.id.match(/module-([0-9]+)/)?.[1] || 0);
        const bNum = Number(b.id.match(/module-([0-9]+)/)?.[1] || 0);
        return aNum - bNum;
      });

      const modules = sortedModules.map((moduleEntry) => {
        const sortedLessons = moduleEntry.lessons.sort((a, b) => a.lessonOrder - b.lessonOrder);
        return {
          ...moduleEntry,
          lessons: sortedLessons.map((lessonEntry, lessonIndex) => ({
            id: `${moduleEntry.id}-lesson-${lessonEntry.lessonOrder}`,
            title: lessonEntry.title,
            title_fr: lessonEntry.title_fr,
            lesson_number: 0,
            content: {
              vocabulary: lessonEntry.content.vocabulary,
              exercises: lessonEntry.content.exercises,
              examples: lessonEntry.content.examples,
            },
            introduction: lessonEntry.introduction,
            module: {
              theme: moduleEntry.label,
              niveau: levelEntry.meta.label,
              description: lessonEntry.introduction,
            },
            chapitreData: lessonEntry.chapitres,
          })),
          rawLessons: sortedLessons,
        };
      });

      return {
        id: levelEntry.meta.id,
        label: levelEntry.meta.label,
        range: levelEntry.meta.range,
        modules,
      };
    });

  let nextLessonNumber = 1;
  levels.forEach((level) => {
    level.modules.forEach((module) => {
      module.lessons.forEach((lesson) => {
        lesson.lesson_number = nextLessonNumber;
        nextLessonNumber += 1;
      });
    });
  });

  levels.forEach((level) => {
    level.modules.forEach((module) => {
      const exerciseSeries = module.lessons.flatMap((lesson) =>
        Array.isArray(lesson.chapitreData)
          ? lesson.chapitreData.flatMap((chapter) =>
              Array.isArray(chapter.exercices)
                ? chapter.exercices.map((exercise, index) => ({
                    title: String(exercise.question || `Exercice ${index + 1}`).trim(),
                    type: String(exercise.type || "texte").trim(),
                    goal: exercise.type === "QCM"
                      ? "Choisis la bonne réponse."
                      : exercise.type === "texte_a_trous"
                        ? "Complète la phrase." 
                        : "Réponds à la consigne.",
                  }))
                : [])
          : []
      );
      module.exerciseSeries = exerciseSeries;
      module.lessons = module.lessons.map((lesson) => ({
        ...lesson,
        content: {
          vocabulary: lesson.content.vocabulary,
          exercises: lesson.content.exercises,
          examples: lesson.content.examples,
        },
      }));
    });
  });

  return levels;
};

const curriculum = buildCurriculum();

const getCurriculum = () => ({ levels: curriculum });

const getLessonMetadata = () => {
  return curriculum.flatMap((level) =>
    level.modules.flatMap((module) =>
      module.lessons.map((lesson) => ({
        lesson_number: lesson.lesson_number,
        title: lesson.title,
        title_fr: lesson.title_fr,
        level: level.label,
        module: {
          theme: module.label,
          niveau: level.label,
          description: lesson.introduction || module.label,
        },
      }))
    )
  );
};

const getVocabularyItemsForLesson = (lessonNumber) => {
  const lesson = curriculum
    .flatMap((level) => level.modules.flatMap((module) => module.lessons.map((l) => ({ ...l, module }))))
    .find((lesson) => lesson.lesson_number === Number(lessonNumber));

  if (!lesson) return [];

  const vocabulary = Array.isArray(lesson.content.vocabulary) ? lesson.content.vocabulary : [];
  return vocabulary.map((item, index) => ({
    id: `${lesson.lesson_number}-${index + 1}`,
    lesson_number: lesson.lesson_number,
    word: item.word,
    translation_fr: item.translation_fr,
    phonetic: item.phonetic || "",
    example_target: item.example_target || "",
    example_fr: item.example_fr || "",
  }));
};

const getVocabularyItems = () => {
  return curriculum.flatMap((level) =>
    level.modules.flatMap((module) =>
      module.lessons.flatMap((lesson) =>
        (Array.isArray(lesson.content.vocabulary) ? lesson.content.vocabulary : []).map((item, index) => ({
          id: `${lesson.lesson_number}-${index + 1}`,
          lesson_number: lesson.lesson_number,
          word: item.word,
          translation_fr: item.translation_fr,
          phonetic: item.phonetic || "",
          example_target: item.example_target || "",
          example_fr: item.example_fr || "",
          level: level.label,
          module: module.label,
        }))
      )
    )
  );
};

const isGuerzeLanguage = (code) => {
  if (!code) return false;
  return String(code).trim().toLowerCase() === "guerze";
};

const getGuerzeLanguage = () => ({ ...GUERZE_LANGUAGE });

export {
  isGuerzeLanguage,
  getGuerzeLanguage,
  getCurriculum as getGuerzeCurriculum,
  getLessonMetadata as getGuerzeLessons,
  getVocabularyItems as getGuerzeVocabularyForLanguage,
  getVocabularyItemsForLesson as getGuerzeVocabularyForLesson,
};
