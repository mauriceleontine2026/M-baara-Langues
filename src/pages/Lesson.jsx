import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getLanguageByCode, getLessonsForLanguage, getVocabularyForLanguage, getVocabularyForLesson } from "@/api/languageService";
import { getProgress, updateProgress } from "@/api/progressService";
import { ArrowLeft, Volume2, Heart, X, Check, WifiOff } from "lucide-react";
import LanguageFlag from "@/components/ui/LanguageFlag";
import { motion, AnimatePresence } from "framer-motion";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getOfflineVocab, getOfflineLessons, getOfflineLang, queueProgressUpdate } from "@/lib/offlineStorage";
import { getNextUnlockedLesson } from "@/lib/progressUtils";
import {
  findModuleByLessonNumber,
  getAvailableState,
  getBeginnerCompletionStatus,
  getLockMessageForModule,
  getCurriculumForLanguageExport,
} from "@/lib/curriculumGate";

export default function Lesson() {
  const { langCode, lessonNum } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [language, setLanguage] = useState(/** @type {any | null} */ (null));
  const [lessonMeta, setLessonMeta] = useState(/** @type {any | null} */ (null));
  const [items, setItems] = useState(/** @type {any[]} */ ([]));
  const [allItems, setAllItems] = useState(/** @type {any[]} */ ([]));
  const [phase, setPhase] = useState("learn");
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quizIdx, setQuizIdx] = useState(0);
  const [choices, setChoices] = useState(/** @type {string[]} */ ([]));
  const [selected, setSelected] = useState(/** @type {string | null} */ (null));
  const [hearts, setHearts] = useState(5);
  const [correct, setCorrect] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(/** @type {string | null} */ (null));
  const [progressError, setProgressError] = useState(/** @type {string | null} */ (null));
  const [completedLessons, setCompletedLessons] = useState([]);
  const [lessonLockedMessage, setLessonLockedMessage] = useState("");
  const [lessonLocked, setLessonLocked] = useState(false);
  const online = useOnlineStatus();

  const getExerciseRecords = () => {
    if (typeof window === "undefined") return {};
    const curriculum = getCurriculumForLanguageExport(langCode);
    return curriculum.levels.reduce((acc, level) => {
      level.modules.forEach((module) => {
        const raw = window.localStorage.getItem(`mbaara-exercise-${langCode}-${module.id}`);
        if (!raw) {
          acc[module.id] = null;
          return;
        }
        try {
          acc[module.id] = JSON.parse(raw);
        } catch (e) {
          acc[module.id] = null;
        }
      });
      return acc;
    }, {});
  };

  useEffect(() => {
    const safeLangCode = langCode || "";
    const safeLessonNum = parseInt(lessonNum || "0", 10);

    setLoading(true);
    setFetchError(null);

    const languagePromise = online
      ? getLanguageByCode(safeLangCode)
      : Promise.resolve(getOfflineLang(safeLangCode));

    const lessonItemsPromise = online
      ? getVocabularyForLesson(safeLangCode, safeLessonNum)
      : Promise.resolve(
          Array.isArray(getOfflineVocab(safeLangCode))
            ? getOfflineVocab(safeLangCode).filter((v) => v.lesson_number === safeLessonNum)
            : []
        );

    const allItemsPromise = online
      ? getVocabularyForLanguage(safeLangCode)
      : Promise.resolve(Array.isArray(getOfflineVocab(safeLangCode)) ? getOfflineVocab(safeLangCode) : []);
    const lessonMetaPromise = online
      ? getLessonsForLanguage(safeLangCode)
      : Promise.resolve(getOfflineLessons(safeLangCode));

    Promise.allSettled([languagePromise, lessonItemsPromise, allItemsPromise, lessonMetaPromise]).then(([langRes, itemsRes, allRes, lessonsRes]) => {
      const meta = lessonsRes.status === "fulfilled" && Array.isArray(lessonsRes.value)
        ? lessonsRes.value.find((lesson) => lesson.lesson_number === safeLessonNum)
        : null;
      setLessonMeta(meta);
      if (langRes.status === "fulfilled") {
        setLanguage(langRes.value ?? null);
      } else {
        setLanguage(null);
      }

      if (itemsRes.status === "fulfilled") {
        setItems(Array.isArray(itemsRes.value) ? itemsRes.value : []);
      } else {
        setItems([]);
      }

      if (allRes.status === "fulfilled") {
        setAllItems(Array.isArray(allRes.value) ? allRes.value : []);
      } else {
        setAllItems([]);
      }

      setLoading(false);
    }).catch((err) => {
      setFetchError(err instanceof Error ? err.message : String(err));
      setLanguage(null);
      setItems([]);
      setAllItems([]);
      setLoading(false);
    });
  }, [langCode, lessonNum, online]);

  useEffect(() => {
    if (!user) return;
    getProgress()
      .then((data) => {
        const progress = Array.isArray(data) ? data.find((p) => p.language_code === langCode) : null;
        const completed = Array.isArray(progress?.completed_lessons)
          ? progress.completed_lessons.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
          : [];
        setCompletedLessons(completed);
      })
      .catch(() => setCompletedLessons([]));
  }, [user, langCode]);

  useEffect(() => {
    const moduleNumber = Number(lessonNum || "0");
    if (!moduleNumber || !langCode) return;
    const exerciseRecords = getExerciseRecords();
    const moduleInfo = findModuleByLessonNumber(moduleNumber, lessonMeta?.module?.niveau || lessonMeta?.level || "", langCode);
    if (moduleInfo) {
      const beginnerStatus = getBeginnerCompletionStatus(completedLessons, exerciseRecords, 70, langCode);
      const available = getAvailableState(moduleInfo.levelIndex, moduleInfo.moduleIndex, moduleInfo.level, moduleInfo.module, completedLessons, exerciseRecords, langCode).available;
      setLessonLocked(!available);
      setLessonLockedMessage(available ? "" : getLockMessageForModule(moduleInfo.levelIndex, moduleInfo.moduleIndex, moduleInfo.level, beginnerStatus.complete));
    } else {
      setLessonLocked(false);
      setLessonLockedMessage("");
    }
  }, [lessonNum, langCode, completedLessons, lessonMeta]);

  useEffect(() => {
    if (phase === "quiz" && items[quizIdx]) {
      const item = items[quizIdx];
      if (allItems.length >= 4) {
        const wrong = allItems.filter(i => i.id !== item.id && i.translation_fr).sort(() => Math.random() - 0.5).slice(0, 3);
        setChoices([...wrong.map(i => i.translation_fr), item.translation_fr].sort(() => Math.random() - 0.5));
      } else {
        setChoices([item.translation_fr]);
      }
      setSelected(null);
    }
  }, [quizIdx, phase, items, allItems]);

  const speak = /** @param {string} text */ (text) => {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(u);
    }
  };

  const nextCard = () => {
    if (cardIdx < items.length - 1) {
      setCardIdx(c => c + 1);
      setFlipped(false);
    } else {
      setPhase("quiz");
      setQuizIdx(0);
    }
  };

  const handleChoice = /** @param {string} choice */ (choice) => {
    if (selected !== null) return;
    setSelected(choice);
    if (choice === items[quizIdx]?.translation_fr) setCorrect((c) => c + 1);
    else setHearts((h) => Math.max(0, h - 1));

    setTimeout(() => {
      if (quizIdx < items.length - 1) setQuizIdx(q => q + 1);
      else { setPhase("complete"); saveProgress(); }
    }, 1200);
  };

  const saveProgress = async () => {
    if (!user) return;
    const xpEarned = Math.round((correct / items.length) * 20) + 5;
    const num = parseInt(lessonNum || "0", 10);
    if (!online) {
      queueProgressUpdate({ type: "lesson_complete", user_id: user.id, language_code: langCode, lesson_number: num, xp: xpEarned });
      const offlineLessons = getOfflineLessons(langCode);
      const lessonNumbers = offlineLessons
        .map((lesson) => Number(lesson?.lesson_number))
        .filter((n) => Number.isFinite(n) && n > 0)
        .sort((a, b) => a - b);
      const nextLessonOffline = getNextUnlockedLesson([num], lessonNumbers);
      try {
        if (typeof window !== "undefined") window.localStorage.setItem(`mbaara-next-lesson-${langCode}`, String(nextLessonOffline));
      } catch (e) {}
      window.dispatchEvent(new Event("mbaara-progress-updated"));
      window.dispatchEvent(new CustomEvent("mbaara-lesson-completed", { detail: { lessonNumber: num, nextLesson: nextLessonOffline, completedLessons: [num] } }));
      // navigate to next lesson when offline
      try {
        navigate(`/lecon/${langCode}/${nextLessonOffline}`);
      } catch (e) {}
      return;
    }
    try {
      setProgressError(null);
      const updated = await updateProgress({ type: "lesson_complete", language_code: langCode, lesson_number: num, xp: xpEarned });
      if (updated?.error) {
        if (updated.status === 401) {
          setProgressError("Vous devez être connecté pour sauvegarder la progression.");
        } else if (updated.status === 422) {
          setProgressError("Impossible de sauvegarder la progression : requête invalide.");
        } else {
          setProgressError("Erreur lors de la sauvegarde de la progression. Réessayez plus tard.");
        }
        return;
      }

      const refreshed = await getProgress();
      const completedLessons = updated?.completed_lessons || refreshed?.find?.((p) => p.language_code === langCode)?.completed_lessons || [];
      const lessonMetaList = online ? await getLessonsForLanguage(langCode) : getOfflineLessons(langCode);
      const lessonNumbers = lessonMetaList?.map((lesson) => lesson.lesson_number).filter((n) => Number.isFinite(Number(n)) && Number(n) > 0) || [];
      const nextLesson = getNextUnlockedLesson(completedLessons, lessonNumbers);
      window.dispatchEvent(new Event("mbaara-progress-updated"));
      window.dispatchEvent(new CustomEvent("mbaara-lesson-completed", { detail: { lessonNumber: num, nextLesson, completedLessons } }));
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`mbaara-next-lesson-${langCode}`, String(nextLesson));
      }
      // navigate to the next lesson automatically when available
      try {
        if (nextLesson && nextLesson > num) {
          navigate(`/lecon/${langCode}/${nextLesson}`);
        } else {
          navigate(`/apprendre/${langCode}`);
        }
      } catch (e) {}
    } catch (error) {
      console.error("Progress update failed", error);
      if (error?.status === 401) {
        setProgressError("Vous devez être connecté pour sauvegarder la progression.");
      } else if (error?.status === 422) {
        setProgressError("Impossible de sauvegarder la progression : requête invalide.");
      } else {
        setProgressError("Erreur lors de la sauvegarde de la progression. Réessayez plus tard.");
      }
    }
  };

  const normalizeLessonLevel = (value) => {
    const raw = String(value || "").trim().toUpperCase();
    if (raw === "A1" || raw === "A2") return "Débutant";
    if (raw === "B1") return "Intermédiaire";
    if (raw === "B2" || raw === "C1" || raw === "C2") return "Avancé";
    if (raw === "DEBUTANT" || raw === "DÉBUTANT") return "Débutant";
    if (raw === "INTERMEDIAIRE" || raw === "INTERMÉDIAIRE") return "Intermédiaire";
    if (raw === "AVANCE" || raw === "AVANCÉ") return "Avancé";
    return value || null;
  };

  const lessonTitle = lessonMeta?.title_fr || lessonMeta?.title || lessonMeta?.module?.theme || `Leçon ${parseInt(lessonNum || "0", 10)}`;
  const lessonDescription = lessonMeta?.module?.description || lessonMeta?.description || lessonMeta?.content || `${items.length} mots à apprendre`;
  const lessonNiveau = normalizeLessonLevel(lessonMeta?.module?.niveau || lessonMeta?.level || null);
  const lessonBlocked = lessonLocked && !loading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-3 px-6 text-center">
        <p className="text-red-500 font-medium">Erreur de chargement : {fetchError}</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm font-medium">← Retour</button>
      </div>
    );
  }

  if (!language) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-3 px-6 text-center">
        <p className="text-muted-foreground">Langue introuvable ou leçon invalide.</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm font-medium">← Retour</button>
      </div>
    );
  }

  if (lessonBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-lg rounded-3xl border border-amber-300/40 bg-amber-500/10 p-8">
          <p className="text-base font-semibold text-amber-900 mb-3">Accès restreint</p>
          <p className="text-sm text-amber-800 mb-6">{lessonLockedMessage || "Cette leçon est verrouillée tant que le niveau Débutant n'est pas achevé avec tous les exercices validés."}</p>
          <button onClick={() => navigate(`/apprendre/${langCode}`)} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Retour au curriculum</button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-3 px-6 text-center">
        <WifiOff size={40} className="text-yellow-500" />
        <p className="text-muted-foreground">Aucun mot trouvé pour cette leçon.</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm font-medium">← Retour</button>
      </div>
    );
  }

  const currentItem = phase === "learn" ? items[cardIdx] : items[quizIdx];
  const progress = phase === "learn" ? (cardIdx / items.length) : (quizIdx / items.length);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          {!online && <span className="flex items-center gap-1 text-xs text-yellow-500 font-medium shrink-0"><WifiOff size={14} /> Hors-ligne</span>}
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 bg-secondary rounded-full h-3 overflow-hidden">
            <motion.div className="h-3 rounded-full" style={{ background: language.color }}
              animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.4 }} />
          </div>
          <div className="flex items-center gap-0.5 text-red-500">
        <div className="mb-6 rounded-3xl bg-card border border-border p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h1 className="text-xl font-semibold text-foreground">{lessonTitle}</h1>
              {lessonNiveau && <p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold mt-1">{lessonNiveau}</p>}
              <p className="text-sm text-muted-foreground mt-1">{lessonDescription}</p>
            </div>
            <LanguageFlag language={language} size="lg" />
          </div>
        </div>
            {[...Array(5)].map((_, i) => (
              <Heart key={i} size={16} fill={i < hearts ? "currentColor" : "none"} className={i < hearts ? "" : "text-muted-foreground/30"} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-6">
        {(lessonMeta?.learning_objectives?.length > 0 || lessonMeta?.phonetic_focus || lessonMeta?.common_phrases?.length > 0 || lessonMeta?.grammar_points?.length > 0 || lessonMeta?.cultural_notes?.length > 0) && (
          <div className="mb-6 space-y-3">
            {lessonMeta.learning_objectives?.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-4">
                <h2 className="font-semibold text-foreground">Objectifs</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {lessonMeta.learning_objectives.map((objective) => <li key={objective}>{objective}</li>)}
                </ul>
              </section>
            )}
            {lessonMeta.phonetic_focus && (
              <section className="rounded-2xl border border-border bg-card p-4">
                <h2 className="font-semibold text-foreground">Focus phonétique</h2>
                <p className="mt-2 text-sm text-muted-foreground">{lessonMeta.phonetic_focus.key_sounds}</p>
                {lessonMeta.phonetic_focus.common_pitfalls && <p className="mt-2 text-sm text-muted-foreground"><strong className="text-foreground">À surveiller : </strong>{lessonMeta.phonetic_focus.common_pitfalls}</p>}
              </section>
            )}
            {lessonMeta.common_phrases?.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-4">
                <h2 className="font-semibold text-foreground">Phrases utiles</h2>
                <div className="mt-2 space-y-2">
                  {lessonMeta.common_phrases.map((phrase) => <p key={phrase.phrase_id || phrase.original} className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{phrase.original}</span> : {phrase.translation}</p>)}
                </div>
              </section>
            )}
            {lessonMeta.grammar_points?.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-4">
                <h2 className="font-semibold text-foreground">Points de grammaire</h2>
                <div className="mt-2 space-y-3">
                  {lessonMeta.grammar_points.map((point) => <div key={point.concept}><h3 className="text-sm font-medium text-foreground">{point.concept}</h3><p className="mt-1 text-sm text-muted-foreground">{point.explanation}</p></div>)}
                </div>
              </section>
            )}
            {lessonMeta.cultural_notes?.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-4">
                <h2 className="font-semibold text-foreground">Notes culturelles</h2>
                <div className="mt-2 space-y-2">{lessonMeta.cultural_notes.map((note) => <p key={note} className="text-sm text-muted-foreground">{note}</p>)}</div>
              </section>
            )}
          </div>
        )}
        {progressError && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {progressError}
          </div>
        )}
        <AnimatePresence mode="wait">
          {phase === "learn" && currentItem && (
            <motion.div key={`learn-${cardIdx}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="flex flex-col items-center gap-6">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Vocabulaire · {cardIdx + 1}/{items.length}</p>
              <div className="w-full max-w-sm cursor-pointer" onClick={() => setFlipped(!flipped)} style={{ perspective: "1000px" }}>
                <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.4 }}
                  style={{ transformStyle: "preserve-3d", position: "relative", height: "200px" }}>
                  <div className="absolute inset-0 rounded-2xl shadow-xl flex flex-col items-center justify-center gap-3 p-6"
                    style={{ backfaceVisibility: "hidden", background: `linear-gradient(135deg, ${language.color}22, ${language.color}44)`, border: `2px solid ${language.color}33` }}>
                    <LanguageFlag language={language} size="lg" />
                    <h2 className="text-3xl font-heading font-bold text-foreground text-center">{currentItem.word}</h2>
                    {currentItem.phonetic && <p className="text-sm text-muted-foreground font-mono">/{currentItem.phonetic}/</p>}
                    <button onClick={e => { e.stopPropagation(); speak(currentItem.word); }} className="text-muted-foreground hover:text-foreground transition mt-1">
                      <Volume2 size={20} />
                    </button>
                    <p className="text-xs text-muted-foreground mt-2">Toucher pour révéler</p>
                  </div>
                  <div className="absolute inset-0 rounded-2xl shadow-xl flex flex-col items-center justify-center gap-3 p-6 bg-card"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", border: `2px solid ${language.color}33` }}>
                    <p className="text-sm text-muted-foreground mb-1">Traduction</p>
                    <h2 className="text-2xl font-heading font-bold text-foreground break-words whitespace-normal text-center">{currentItem.translation_fr}</h2>
                    {currentItem.example_target && (
                      <div className="text-center mt-2 bg-secondary rounded-xl p-3 w-full">
                        <p className="text-sm text-foreground italic">"{currentItem.example_target}"</p>
                        <p className="text-xs text-muted-foreground mt-1">{currentItem.example_fr}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
              <button onClick={nextCard} className="w-full max-w-sm py-4 rounded-2xl text-white font-bold shadow-lg transition hover:opacity-90 active:scale-95"
                style={{ background: language.color }}>
                {cardIdx < items.length - 1 ? "Suivant" : "Passer au quiz →"}
              </button>
            </motion.div>
          )}

          {phase === "quiz" && currentItem && (
            <motion.div key={`quiz-${quizIdx}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-6">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Quiz · {quizIdx + 1}/{items.length}</p>
              <div className="bg-card rounded-2xl p-6 shadow-sm text-center border border-border">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <LanguageFlag language={language} size="md" />
                  <h2 className="text-3xl font-heading font-bold text-foreground">{currentItem.word}</h2>
                  <button onClick={() => speak(currentItem.word)} className="text-muted-foreground hover:text-foreground"><Volume2 size={18} /></button>
                </div>
                {currentItem.phonetic && <p className="text-sm text-muted-foreground font-mono">/{currentItem.phonetic}/</p>}
                <p className="text-muted-foreground text-sm mt-2">Quelle est la traduction ?</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {choices.map((choice, i) => {
                  const isCorrect = choice === currentItem.translation_fr;
                  let bg = "bg-card border-border text-foreground";
                  if (selected !== null) {
                    if (choice === selected && isCorrect) bg = "bg-green-500/10 border-green-500 text-green-600 dark:text-green-400";
                    else if (choice === selected && !isCorrect) bg = "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400";
                    else if (isCorrect) bg = "bg-green-500/10 border-green-500 text-green-600 dark:text-green-400";
                    else bg = "bg-secondary border-border text-muted-foreground";
                  }
                  return (
                    <button key={i} onClick={() => handleChoice(choice)}
                      className={`w-full py-4 px-5 rounded-2xl border-2 font-medium text-left flex items-center justify-between transition ${bg} ${selected === null ? "hover:border-primary/40 cursor-pointer" : "cursor-default"}`}>
                      <span className="break-words whitespace-normal max-w-[85%]">{choice}</span>
                      {selected !== null && isCorrect && <Check size={18} className="text-green-500" />}
                      {selected === choice && !isCorrect && <X size={18} className="text-red-500" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {phase === "complete" && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6 text-center py-8">
              <div className="text-7xl">🎉</div>
              <h2 className="text-2xl font-heading font-bold text-foreground">Leçon terminée !</h2>
              <div className="flex gap-6">
                <div className="bg-yellow-500/10 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-yellow-500">{Math.round((correct / items.length) * 20) + 5}</div>
                  <div className="text-xs text-muted-foreground">XP gagnés</div>
                </div>
                <div className="bg-green-500/10 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-green-500">{correct}/{items.length}</div>
                  <div className="text-xs text-muted-foreground">Bonnes réponses</div>
                </div>
                <div className="bg-red-500/10 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-red-400">{hearts}</div>
                  <div className="text-xs text-muted-foreground">Cœurs restants</div>
                </div>
              </div>
              <button onClick={() => navigate(`/apprendre/${langCode}`)} className="w-full max-w-sm py-4 rounded-2xl text-white font-bold shadow-lg transition hover:opacity-90"
                style={{ background: language.color }}>
                Continuer →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}