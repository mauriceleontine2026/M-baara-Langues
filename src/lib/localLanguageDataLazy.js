const LEVEL_META = {
  "Débutant": { id: "niveau-debutant", label: "Débutant", range: "A1 - A2" },
  "Intermédiaire": { id: "niveau-intermediaire", label: "Intermédiaire", range: "B1 - B2" },
  "Avancé": { id: "niveau-avance", label: "Avancé", range: "C1 - C2" },
};

const LOCAL_LANGUAGE_META_OVERRIDES = {
  kono: {
    code: "kono",
    name: "Kônon",
    name_fr: "Kônon",
    region: "Guinée / Guinée Forestière",
    family: "Mandé",
    status: "active",
    flag_emoji: "🇬🇳",
    color: "#6D4C41",
    description: "Langue de Guinée forestière",
  },
  soussou: {
    code: "soussou",
    name: "Soussou",
    name_fr: "Soussou",
    region: "Afrique de l'Ouest",
    family: "Mande",
    status: "active",
    flag_emoji: "🌍",
    color: "#0f766e",
    description: "Langue Soussou",
  },
  pular: {
    code: "pular",
    name: "Pular",
    name_fr: "Pular",
    region: "Afrique de l'Ouest",
    family: "Fula",
    status: "active",
    flag_emoji: "🌍",
    color: "#1d4ed8",
    description: "Langue Pular",
  },
  malinke: {
    code: "malinke",
    name: "Malinké",
    name_fr: "Malinké",
    region: "Afrique de l'Ouest",
    family: "Mande",
    status: "active",
    flag_emoji: "🌍",
    color: "#a16207",
    description: "Langue Malinké",
  },
  kissi: {
    code: "kissi",
    name: "Kissi",
    name_fr: "Kissi",
    region: "Afrique de l'Ouest",
    family: "Kru",
    status: "active",
    flag_emoji: "🌍",
    color: "#047857",
    description: "Langue Kissi",
  },
  wolof: {
    code: "wolof",
    name: "Wolof",
    name_fr: "Wolof",
    region: "Afrique de l'Ouest",
    family: "Niger-Congo",
    status: "active",
    flag_emoji: "🌍",
    color: "#b91c1c",
    description: "Langue Wolof",
  },
  guerze: {
    code: "guerze",
    name: "Guerzé (Kpelé)",
    name_fr: "Guerzé",
    region: "Guinée Forestière",
    family: "Mandé",
    status: "active",
    flag_emoji: "🌍",
    color: "#7B3E8A",
    description: "Langue Guerzé (Kpelé)",
  },
};

const normalizeText = (value) => String(value || "").trim();
const normalizeLanguageCode = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/é/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/^konon$/, "kono");

const getLanguageFolderFromPath = (filePath) => {
  const normalized = String(filePath || "").replace(/\\/g, "/");
  const match = normalized.match(/(?:^|\/)\.\.\/?data\/([^/]+)\//i);
  return match ? match[1] : null;
};

const getLanguageMetaFromFolder = (folderName) => {
  const code = normalizeLanguageCode(folderName);
  const override = LOCAL_LANGUAGE_META_OVERRIDES[code];
  if (override) return { ...override };
  const name = folderName.trim();
  return {
    code,
    name,
    name_fr: name,
    region: "Monde",
    family: "",
    status: "active",
    flag_emoji: "🌍",
    color: "#0f766e",
    description: `Langue ${name}`,
  };
};

const localLanguageFileLoaders = new Map();
const localLanguageMetaByCode = new Map();
const localLanguageJsonCache = new Map();
const curriculumCache = new Map();

const localLanguageFiles = import.meta.glob("../data/**/*.{json,JSON}", { as: "raw" });

Object.entries(localLanguageFiles).forEach(([filePath, loader]) => {
  const folderName = getLanguageFolderFromPath(filePath);
  if (!folderName) return;

  const languageCode = normalizeLanguageCode(folderName);
  if (!languageCode) return;

  if (!localLanguageFileLoaders.has(languageCode)) {
    localLanguageFileLoaders.set(languageCode, []);
    localLanguageMetaByCode.set(languageCode, getLanguageMetaFromFolder(folderName));
  }

  localLanguageFileLoaders.get(languageCode).push({ filePath, loader });
});

const loadLocalLanguageFiles = async (languageCode) => {
  const normalized = normalizeLanguageCode(languageCode);
  const fileEntries = localLanguageFileLoaders.get(normalized) || [];
  if (localLanguageJsonCache.has(normalized)) {
    return localLanguageJsonCache.get(normalized);
  }

  const fileResults = await Promise.all(
    fileEntries.map(async ({ filePath, loader }) => {
      try {
        const raw = await loader();
        let content = raw;
        if (typeof raw === "string") {
          try {
            content = JSON.parse(raw);
          } catch (e) {
            // If parsing fails, skip this file but log a warning.
            console.warn(`Skipping invalid JSON file: ${filePath}`);
            return null;
          }
        } else if (raw && typeof raw === "object" && "default" in raw) {
          // some bundlers return a module object with a default export
          content = raw.default;
        }
        return { filePath, content };
      } catch (error) {
        console.error(`Unable to load local language file: ${filePath}`, error);
        return null;
      }
    })
  );

  const validFiles = fileResults.filter((item) => item && item.content && typeof item.content === "object");
  localLanguageJsonCache.set(normalized, validFiles);
  return validFiles;
};

const parseLevelMeta = (value) => {
  const raw = String(value || "").trim();
  const match = raw.match(/^(.+?)\s*\(([^)]+)\)/);
  const label = match ? match[1].trim() : raw;
  const range = match ? match[2].trim() : "";
  const normalized = normalizeText(label).toLowerCase();

  if (normalized.includes("débutant") || normalized.includes("a1") || normalized.includes("a2")) {
    return { ...LEVEL_META["Débutant"], range: range || LEVEL_META["Débutant"].range };
  }
  if (normalized.includes("intermédiaire") || normalized.includes("b1") || normalized.includes("b2")) {
    return { ...LEVEL_META["Intermédiaire"], range: range || LEVEL_META["Intermédiaire"].range };
  }
  if (normalized.includes("avancé") || normalized.includes("c1") || normalized.includes("c2")) {
    return { ...LEVEL_META["Avancé"], range: range || LEVEL_META["Avancé"].range };
  }

  const meta = LEVEL_META[label] || {
    id: `niveau-${normalizeText(label).replace(/[^a-z0-9]+/gi, "-")}`,
    label: label || "Débutant",
    range,
  };
  return { ...meta, range: range || meta.range };
};

const parseLessonOrder = (filePath, title) => {
  const candidate = `${String(filePath || "")} ${String(title || "")}`;
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

const getModuleInfoFromPath = (filePath) => {
  const segments = String(filePath || "").split(/[\\/]/).filter(Boolean);
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

const buildCurriculum = (lessons) => {
  const levelMap = new Map();

  lessons.forEach(({ filePath, content }) => {
    const entries = Array.isArray(content) ? content : [content];
    entries.forEach((entry) => {
      if (!entry || typeof entry !== "object") return;

      const moduleData = Array.isArray(entry.modules) ? entry.modules[0] : entry.modules;
      if (!moduleData || typeof moduleData !== "object") return;

      const { moduleNumber, levelTitle } = getModuleInfoFromPath(filePath);
      const levelInfo = parseLevelMeta(entry.niveau || entry.level || levelTitle || "Débutant");
      const levelKey = levelInfo.label;
      const moduleIdNumber = moduleNumber > 0 ? moduleNumber : Number(moduleData.id_module) || 0;
      const moduleLabel = getModuleTitle(moduleData, filePath);
      const lessonOrder = parseLessonOrder(filePath, entry.titre_cours || entry.titre_cour || entry.title || "Leçon 1");
      const lessonTitle = String(entry.titre_cours || entry.titre_cour || entry.title || `Leçon ${lessonOrder}`).trim();
      const chapters = Array.isArray(moduleData.chapitres) ? moduleData.chapitres : [];

      if (!levelMap.has(levelKey)) {
        levelMap.set(levelKey, { meta: levelInfo, modules: new Map() });
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
        introduction: String(entry.introduction || "").trim(),
        chapitres: chapters,
        content: {
          vocabulary: Array.isArray(chapters)
            ? chapters.flatMap((chapter) =>
                Array.isArray(chapter.vocabulaire_cles)
                  ? chapter.vocabulaire_cles.map((v) => ({
                      word: v.terme,
                      translation_fr: v.traduction_ou_definition,
                      phonetic: v.phonetic || "",
                      example_target: v.example_target || "",
                      example_fr: v.example_fr || "",
                    }))
                  : []
              )
            : [],
          exercises: Array.isArray(chapters)
            ? chapters.flatMap((chapter) => (Array.isArray(chapter.exercices) ? chapter.exercices : []))
            : [],
          examples: Array.isArray(chapters)
            ? chapters.flatMap((chapter) => (Array.isArray(chapter.exemples) ? chapter.exemples : []))
            : [],
        },
      });
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

      return {
        id: levelEntry.meta.id,
        label: levelEntry.meta.label,
        range: levelEntry.meta.range,
        modules: sortedModules.map((moduleEntry) => {
          const sortedLessons = moduleEntry.lessons.sort((a, b) => a.lessonOrder - b.lessonOrder);
          return {
            ...moduleEntry,
            lessons: sortedLessons.map((lessonEntry) => ({
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
                description: lessonEntry.introduction || moduleEntry.label,
              },
              chapitreData: lessonEntry.chapitres,
            })),
            rawLessons: sortedLessons,
          };
        }),
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
                    goal:
                      exercise.type === "QCM"
                        ? "Choisis la bonne réponse."
                        : exercise.type === "texte_a_trous"
                        ? "Complète la phrase."
                        : "Réponds à la consigne.",
                  }))
                : []
            )
          : []
      );
      module.exerciseSeries = exerciseSeries;
    });
  });

  return levels;
};

export const isLocalLanguage = (code) => localLanguageMetaByCode.has(normalizeLanguageCode(code));

export const getLocalLanguage = (code) => localLanguageMetaByCode.get(normalizeLanguageCode(code)) ?? null;

export const getLocalLanguages = () => [...localLanguageMetaByCode.values()];

export const getLocalCurriculum = async (languageCode) => {
  if (!isLocalLanguage(languageCode)) {
    return { levels: [] };
  }

  const normalized = normalizeLanguageCode(languageCode);
  if (curriculumCache.has(normalized)) {
    return curriculumCache.get(normalized);
  }

  const files = await loadLocalLanguageFiles(normalized);
  const curriculum = { levels: buildCurriculum(files) };
  curriculumCache.set(normalized, curriculum);
  return curriculum;
};

export const getLocalLessons = async (languageCode) => {
  const curriculum = await getLocalCurriculum(languageCode);
  return curriculum.levels.flatMap((level) =>
    level.modules.flatMap((module) =>
      module.lessons.map((lesson) => ({
        ...lesson,
        module: {
          theme: module.label,
          niveau: level.label,
          description: lesson.introduction || module.label,
        },
      }))
    )
  );
};

export const getVocabularyForLanguage = async (languageCode) => {
  const curriculum = await getLocalCurriculum(languageCode);
  return curriculum.levels.flatMap((level) =>
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

export const getVocabularyForLesson = async (languageCode, lessonNumber) => {
  const curriculum = await getLocalCurriculum(languageCode);
  const lesson = curriculum.levels
    .flatMap((level) => level.modules.flatMap((module) => module.lessons))
    .find((lesson) => lesson.lesson_number === Number(lessonNumber));
  if (!lesson) return [];
  return Array.isArray(lesson.content.vocabulary) ? lesson.content.vocabulary : [];
};
