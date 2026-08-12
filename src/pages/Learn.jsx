// @ts-nocheck
// Updated Learn page with all languages from data folder
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getLanguages, getVocabularyForLanguage, getLessonsForLanguage } from "@/api/languageService";
import { getProgress } from "@/api/progressService";
import { ArrowLeft, ArrowRight, Lock, CheckCircle, BookOpen, Download, Trash2, WifiOff, Loader2 } from "lucide-react";
import LanguageFlag from "@/components/ui/LanguageFlag";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { downloadLanguageOffline, isLanguageDownloaded, removeLanguageOffline, getOfflineVocab, getOfflineLanguages } from "@/lib/offlineStorage";
import {
  getBeginnerCompletionStatus,
  getAvailableState,
  getLockMessageForModule,
  getCurriculumForLanguageExport,
} from "@/lib/curriculumGate";

export default function Learn() {
  const { langCode } = useParams();
  const { user } = useAuth();
  /** @type {[any[], import('react').Dispatch<import('react').SetStateAction<any[]>>]} */
  const languagesState = useState(/** @type {any[]} */ ([]));
  const [languages, setLanguages] = languagesState;
  /** @type {[any[], import('react').Dispatch<import('react').SetStateAction<any[]>>]} */
  const progressesState = useState(/** @type {any[]} */ ([]));
  const [progresses, setProgresses] = progressesState;
  /** @type {[any[], import('react').Dispatch<import('react').SetStateAction<any[]>>]} */
  const itemsState = useState(/** @type {any[]} */ ([]));
  const [items, setItems] = itemsState;
  const [lessons, setLessons] = useState([]);
  const [filter, setFilter] = useState("all");
  const online = useOnlineStatus();
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (online) {
      getLanguages()
        .then((data) => setLanguages(Array.isArray(data) ? data : []))
        .catch(() => setLanguages([]));
    } else {
      const offlineLanguages = getOfflineLanguages();
      setLanguages(Array.isArray(offlineLanguages) ? offlineLanguages : []);
    }
  }, [online]);

  useEffect(() => {
    const refreshProgress = () => {
      if (!user) return;
      getProgress()
        .then((data) => setProgresses(Array.isArray(data) ? data : []))
        .catch(() => setProgresses([]));
    };

    refreshProgress();
    window.addEventListener("mbaara-progress-updated", refreshProgress);
    window.addEventListener("mbaara-lesson-completed", refreshProgress);

    return () => {
      window.removeEventListener("mbaara-progress-updated", refreshProgress);
      window.removeEventListener("mbaara-lesson-completed", refreshProgress);
    };
  }, [user]);

  useEffect(() => {
    if (langCode) {
      setDownloaded(isLanguageDownloaded(langCode));
      if (online) {
        Promise.all([
          getVocabularyForLanguage(langCode),
          getLessonsForLanguage(langCode),
        ])
          .then(([vocabData, lessonsData]) => {
            setItems(Array.isArray(vocabData) ? vocabData : []);
            setLessons(Array.isArray(lessonsData) ? lessonsData : []);
          })
          .catch(() => {
            setItems([]);
            setLessons([]);
          });
      } else {
        const offlineVocab = getOfflineVocab(langCode);
        setItems(Array.isArray(offlineVocab) ? offlineVocab : []);
        setLessons([]);
      }
    } else {
      setItems([]);
      setLessons([]);
    }
  }, [langCode, online]);

  const downloadLanguage = async () => {
    setDownloading(true);
    try {
      await downloadLanguageOffline(langCode);
      setDownloaded(true);
    } catch (/** @type {any} */ err) {
      const message = err?.message || String(err);
      alert("Erreur: " + message);
    } finally {
      setDownloading(false);
    }
  };

  const removeDownload = () => {
    removeLanguageOffline(langCode);
    setDownloaded(false);
  };

  // Group by region
  const safeLanguages = Array.isArray(languages) ? languages : [];
  const safeItems = Array.isArray(items) ? items : [];
  const safeLessons = Array.isArray(lessons) ? lessons : [];
  const safeProgresses = Array.isArray(progresses) ? progresses : [];
  /** @type {{ [region: string]: any[] }} */
  const regions = {};
  safeLanguages.forEach(l => {
    const r = l?.region || "Autre";
    if (!regions[r]) regions[r] = [];
    regions[r].push(l);
  });
  const regionKeys = Object.keys(regions);

  const readExerciseRecord = (moduleId) => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(`mbaara-exercise-${langCode}-${moduleId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
      return null;
    }
  };

  const getExerciseRecords = () => {
    const curriculum = getCurriculumForLanguageExport(langCode);
    return curriculum.levels.reduce((acc, level) => {
      level.modules.forEach((module) => {
        acc[module.id] = readExerciseRecord(module.id);
      });
      return acc;
    }, {});
  };

  // Detail view
  if (langCode) {
    const lang = safeLanguages.find(l => l.code === langCode);
    if (!lang) return <div className="p-10 text-center text-muted-foreground">Chargement...</div>;

    const prog = safeProgresses.find(p => p.language_code === langCode);
    const completed = Array.isArray(prog?.completed_lessons) ? prog.completed_lessons.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0) : [];
    const completedSet = new Set(completed);
    const totalLessonCount = Math.max(1, Array.isArray(safeLessons) ? safeLessons.length : 0);
    const exerciseRecords = getExerciseRecords();
    const beginnerStatus = getBeginnerCompletionStatus(completed, exerciseRecords);

    return (
      <div className="p-6 lg:p-10 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link to="/apprendre" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Retour
          </Link>
          {!online && (
            <span className="flex items-center gap-1.5 text-xs text-yellow-500 font-medium">
              <WifiOff size={14} /> Hors-ligne
            </span>
          )}
          {online && (
            downloaded ? (
              <button onClick={removeDownload} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 font-medium transition">
                <Trash2 size={14} /> Retirer le téléchargement
              </button>
            ) : (
              <button onClick={downloadLanguage} disabled={downloading}
                className="flex items-center gap-1.5 text-xs text-primary font-medium hover:opacity-80 transition disabled:opacity-60">
                {downloading ? <><Loader2 size={14} className="animate-spin" /> Téléchargement...</> : <><Download size={14} /> Télécharger pour hors-ligne</>}
              </button>
            )
          )}
        </div>
        <div className="rounded-3xl p-6 mb-6 text-white" style={{ background: `linear-gradient(135deg, ${lang.color}, ${lang.color}cc)` }}>
          <div className="flex items-center gap-4">
            <LanguageFlag language={lang} size="lg" />
            <div>
              <h1 className="font-heading text-2xl font-bold">{lang.name_fr}</h1>
              <p className="text-white/80 text-sm">{lang.description || lang.region}</p>
            </div>
          </div>
          {prog && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>Progression</span><span>{completed.length}/{totalLessonCount} leçons</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div className="h-2 bg-white rounded-full" style={{ width: `${Math.min(100, (completed.length / Math.max(1, totalLessonCount)) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="mb-6 rounded-[28px] border border-border/80 bg-gradient-to-br from-card via-card to-background/90 p-5 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Structure pédagogique</h2>
              <p className="text-sm text-muted-foreground">Clique sur un module puis choisis la leçon à lancer</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Curriculum</span>
          </div>
          <div className="space-y-4">
            {getCurriculumForLanguageExport(langCode).levels.map((level, levelIndex) => {
              const exerciseRecords = getExerciseRecords();
              const beginnerStatus = getBeginnerCompletionStatus(completed, exerciseRecords, 70, langCode);
              const levelModulesState = level.modules.map((module, moduleIndex) => ({
                ...getAvailableState(levelIndex, moduleIndex, level, module, completed, exerciseRecords, langCode),
                module,
              }));
              const levelUnlocked = levelIndex === 0 || beginnerStatus.complete;
              return (
                <div key={level.id} className={`rounded-[24px] border border-border/80 p-4 shadow-sm ${
                  levelIndex > 0 && !beginnerStatus.complete ? "bg-slate-950/20" : "bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.02))]"
                }`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-foreground">{level.label}</div>
                      <div className="text-sm text-muted-foreground">{level.range}</div>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary font-semibold">{level.modules.length} modules</span>
                  </div>
                  {level.globalReview && (
                    <div className="mb-4 rounded-[20px] border border-primary/25 bg-primary/5 p-3.5">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Exercice global</div>
                      <div className="mt-1 text-base font-semibold text-foreground">{level.globalReview.title}</div>
                      <div className="text-sm text-muted-foreground">{level.globalReview.description}</div>
                      <ul className="mt-2 list-disc pl-4 text-sm text-muted-foreground space-y-1">
                        {level.globalReview.tasks.map((task) => (
                          <li key={task}>{task}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="grid gap-3">
                    {level.modules.map((module, moduleIndex) => {
                      const state = levelModulesState[moduleIndex];
                      const lessonLinksDisabled = !state.available || (levelIndex > 0 && !levelUnlocked);
                      const practiceDisabled = !state.available || (levelIndex > 0 && !levelUnlocked);
                      const onlyFirstLevelUnlock = levelIndex === 0 && moduleIndex === 0;
                      return (
                          <details key={module.id} className="rounded-[20px] bg-secondary/40 p-3.5 shadow-[0_10px_25px_-20px_rgba(0,0,0,0.55)]" open={levelIndex === 0 && moduleIndex === 0}>
                          <summary className="cursor-pointer list-none text-base font-semibold text-foreground mb-2 flex items-center justify-between gap-2">
                            <span>{module.label}</span>
                            <span className="text-sm text-muted-foreground">{module.lessons.length} leçons</span>
                          </summary>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {module.lessons.map((lesson) => (
                              <Link
                                key={lesson.id}
                                to={lessonLinksDisabled ? "#" : `/lecon/${langCode}/${lesson.lesson_number}`}
                                onClick={(event) => {
                                  if (lessonLinksDisabled) {
                                    event.preventDefault();
                                  }
                                }}
                                className={`rounded-full bg-card px-3 py-1.5 text-sm font-medium ring-1 ring-border transition ${
                                  lessonLinksDisabled
                                    ? "text-muted-foreground/50 cursor-not-allowed"
                                    : "text-muted-foreground hover:text-foreground hover:ring-primary/40"
                                }`}
                              >
                                {lesson.title}
                              </Link>
                            ))}
                          </div>
                          {Array.isArray(module.exerciseSeries) && module.exerciseSeries.length > 0 && (
                            <div className="mt-3 rounded-[18px] border border-border/80 bg-card/75 p-3">
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Série d’exercices</div>
                                <Link
                                  to={practiceDisabled ? "#" : `/exercice/${langCode}/${module.id}`}
                                  onClick={(event) => {
                                    if (practiceDisabled) {
                                      event.preventDefault();
                                    }
                                  }}
                                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                    practiceDisabled
                                      ? "bg-muted text-muted-foreground/60 cursor-not-allowed"
                                      : "bg-primary text-primary-foreground"
                                  }`}
                                >
                                  Pratiquer
                                </Link>
                              </div>
                              <div className="space-y-2">
                                {module.exerciseSeries.map((exercise) => (
                                  <div key={exercise.title} className="rounded-[14px] bg-background/70 px-3 py-2">
                                    <div className="text-sm font-semibold text-foreground">{exercise.title}</div>
                                    <div className="text-sm text-muted-foreground">{exercise.type} · {exercise.goal}</div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 text-sm text-muted-foreground">
                                {state.exerciseCompleted
                                  ? `Moyenne des exercices : ${state.exerciseScore}%`
                                  : "Exercices non encore validés."}
                              </div>
                            </div>
                          )}
                          {!state.available && (
                            <div className="mt-2 rounded-[16px] border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                              {getLockMessageForModule(levelIndex, moduleIndex, level, beginnerStatus.complete)}
                            </div>
                          )}
                        </details>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    );
  }

  // Grid view
  const available = online ? safeLanguages : safeLanguages.filter(l => isLanguageDownloaded(l?.code));
  const filtered = filter === "all" ? available : available.filter(l => ((l?.region || "") + "").includes(filter));
  const safeFiltered = Array.isArray(filtered) ? filtered : [];

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <h1 className="font-heading text-3xl font-bold text-foreground mb-1">Apprendre</h1>
      <p className="text-muted-foreground mb-6">{safeLanguages.length} langues disponibles</p>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        <button onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"}`}>
          Toutes
        </button>
        {regionKeys.map(r => (
          <button key={r} onClick={() => setFilter(r)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${filter === r ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"}`}>
            {r}
          </button>
        ))}
      </div>

      {/* Language cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {safeFiltered.map(lang => {
          const prog = safeProgresses.find(p => p.language_code === lang.code);
          const pct = prog ? Math.min(100, ((prog.current_lesson - 1) / Math.max(1, lang.total_lessons || 20)) * 100) : 0;
          return (
            <Link key={lang.id} to={`/apprendre/${lang.code}`}
              className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <LanguageFlag language={lang} size="lg" />
                  <div>
                    <div className="font-heading font-bold text-foreground">{lang.name_fr}</div>
                    <div className="text-xs text-muted-foreground">{lang.region}</div>
                  </div>
                </div>
                {lang.status === "coming_soon" && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full">Bientôt</span>
                )}
                {isLanguageDownloaded(lang.code) && (
                  <span className="flex items-center gap-1 text-xs bg-green-500/15 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                    <Download size={10} /> Hors-ligne
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{lang.description || `Langue de ${lang.region}`}</p>
              <div className="w-full bg-secondary rounded-full h-1.5 mb-3">
                <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: lang.color }} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{prog?.xp || 0} XP</span>
                <span className="flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
                  Commencer <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}