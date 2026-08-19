import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getLanguageByCode, getLessonsForLanguage, getVocabularyForLanguage, getVocabularyForLesson } from "@/api/languageService";
import { getProgress, updateProgress } from "@/api/progressService";
import { ArrowLeft, Volume2, Heart, X, Check, WifiOff, BookOpen, Target, MessageCircle, Sparkles } from "lucide-react";
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
  const [activeSection, setActiveSection] = useState(null);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [showDialogueTranslation, setShowDialogueTranslation] = useState(false);
  const [dialogueRole, setDialogueRole] = useState(null);
  const [dialogueSpoken, setDialogueSpoken] = useState(false);
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

  const playAudio = (item) => {
    if (item?.audio_url) {
      const audio = new Audio(item.audio_url);
      audio.play().catch(() => speak(item.word));
      return;
    }
    speak(item?.word || "");
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
    <div className="min-h-screen bg-background flex flex-col" style={{ backgroundImage: `radial-gradient(circle at 15% 0%, ${language.color}18, transparent 32%), radial-gradient(circle at 90% 18%, ${language.color}12, transparent 28%)` }}>
      <div className="sticky top-0 z-20 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          {!online && <span className="flex items-center gap-1 text-xs text-yellow-500 font-medium shrink-0"><WifiOff size={14} /> Hors-ligne</span>}
          <button aria-label="Retour au curriculum" onClick={() => navigate(-1)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground transition">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span>{phase === "learn" ? "Apprentissage" : phase === "quiz" ? "Quiz" : "Terminé"}</span>
              <span>{phase === "learn" ? `${cardIdx + 1}/${items.length}` : phase === "quiz" ? `${quizIdx + 1}/${items.length}` : "100%"}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <motion.div className="h-2 rounded-full" style={{ background: language.color }}
              animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.4 }} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 text-red-500">
            {[...Array(5)].map((_, i) => (
              <Heart key={i} size={16} fill={i < hearts ? "currentColor" : "none"} className={i < hearts ? "" : "text-muted-foreground/30"} />
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 lg:px-8 lg:py-10">
        <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-[0_24px_80px_-44px_rgba(0,0,0,0.6)] lg:p-10">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-20 blur-3xl" style={{ background: language.color }} />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                <span className="rounded-full bg-primary/10 px-3 py-1.5">Leçon {lessonNum}</span>
                {lessonNiveau && <span className="rounded-full border border-border px-3 py-1.5 text-muted-foreground">{lessonNiveau}</span>}
              </div>
              <h1 className="font-heading text-3xl font-bold leading-tight text-foreground lg:text-5xl">{lessonTitle}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground lg:text-base">{lessonDescription}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl text-white shadow-lg" style={{ background: language.color }}><LanguageFlag language={language} size="lg" /></div>
              <div><div className="text-sm font-semibold text-foreground">{language.name_fr}</div><div className="text-xs text-muted-foreground">{language.region}</div></div>
            </div>
          </div>
          <div className="relative mt-8 grid grid-cols-2 gap-3 border-t border-border/70 pt-5 sm:grid-cols-4">
            {[{ icon: BookOpen, value: items.length, label: "mots" }, { icon: Target, value: lessonMeta?.learning_objectives?.length || 0, label: "objectifs" }, { icon: MessageCircle, value: lessonMeta?.common_phrases?.length || 0, label: "phrases" }, { icon: Sparkles, value: lessonMeta?.grammar_points?.length || 0, label: "points clés" }].map(({ icon: Icon, value, label }) => <div key={label} className="flex items-center gap-2"><Icon size={17} style={{ color: language.color }} /><div><div className="font-semibold text-foreground">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div></div>)}
          </div>
        </section>
        <nav aria-label="Sections de la leçon" className="mb-8 rounded-[1.75rem] border border-border/70 bg-card/75 p-4 shadow-sm backdrop-blur-sm">
          <div className="mb-3 px-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Choisir une partie</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {[{ id: "objectifs", label: "Objectifs", icon: Target }, { id: "vocabulaire", label: "Vocabulaire", icon: BookOpen }, { id: "phrases", label: "Phrases", icon: MessageCircle }, { id: "phonétique", label: "Phonétique", icon: Volume2 }, { id: "grammaire", label: "Grammaire", icon: Sparkles }, { id: "dialogue", label: "Dialogue", icon: MessageCircle }, { id: "culture", label: "Culture", icon: Sparkles }, { id: "exercices", label: "Exercices", icon: Target }].map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setActiveSection(id)} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${activeSection === id ? "border-primary bg-primary text-primary-foreground shadow-lg" : "border-border bg-background/70 text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-foreground"}`}>
                <Icon size={15} className="text-primary" />{label}
              </button>
            ))}
          </div>
        </nav>
        {activeSection && <button type="button" onClick={() => setActiveSection(null)} className="mb-5 text-sm font-semibold text-primary hover:underline">← Revenir aux thèmes</button>}
        {activeSection && (lessonMeta?.learning_objectives?.length > 0 || lessonMeta?.phonetic_focus || lessonMeta?.common_phrases?.length > 0 || lessonMeta?.grammar_points?.length > 0 || lessonMeta?.cultural_notes?.length > 0) && (
          <div className="mb-8 grid gap-4 lg:grid-cols-2">
            {activeSection === "objectifs" && lessonMeta.learning_objectives?.length > 0 && (
              <section id="objectifs" className="scroll-mt-24 rounded-2xl border border-neutral-700/40 bg-[#211d1c] p-5 shadow-[0_20px_55px_-35px_rgba(0,0,0,0.9)]">
                <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">Ton itinéraire</p><h2 className="mt-1 flex items-center gap-2 font-semibold text-white"><Target size={18} className="text-orange-400" />Objectifs à débloquer</h2></div><span className="rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-300">{lessonMeta.learning_objectives.length} étapes</span></div>
                <div className="grid gap-3 sm:grid-cols-2">{lessonMeta.learning_objectives.map((objective, index) => <motion.article initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * .08 }} key={objective} className="group relative overflow-hidden rounded-2xl border border-neutral-700/40 bg-neutral-900/60 p-4 transition hover:-translate-y-1 hover:border-orange-500/50"><div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-orange-500/10 blur-xl transition group-hover:bg-orange-500/25" /><span className="relative grid h-8 w-8 place-items-center rounded-xl bg-orange-500 text-xs font-black text-white">{index + 1}</span><p className="relative mt-3 text-sm leading-6 text-neutral-200">{objective}</p></motion.article>)}</div>
              </section>
            )}
            {activeSection === "phonétique" && lessonMeta.phonetic_focus && (
              <section id="phonétique" className="scroll-mt-24 rounded-2xl border border-neutral-700/40 bg-[#211d1c] p-5 shadow-[0_20px_55px_-35px_rgba(0,0,0,0.9)]">
                <h2 className="flex items-center gap-2 font-semibold text-white"><Volume2 size={18} className="text-orange-400" />Focus phonétique</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2"><motion.article whileHover={{ y: -4 }} className="rounded-2xl border border-orange-500/25 bg-gradient-to-br from-orange-500/15 to-orange-950/20 p-5"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-orange-400">À retenir</p><span className="text-2xl">〰</span></div><p className="text-sm leading-6 text-neutral-200">{lessonMeta.phonetic_focus.key_sounds}</p></motion.article>{lessonMeta.phonetic_focus.common_pitfalls && <motion.article whileHover={{ y: -4 }} className="rounded-2xl border border-neutral-700/40 bg-neutral-900/60 p-5"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-neutral-400">À surveiller</p><span className="text-2xl text-amber-400">!</span></div><p className="text-sm leading-6 text-neutral-300">{lessonMeta.phonetic_focus.common_pitfalls}</p></motion.article>}</div>
              </section>
            )}
            {activeSection === "phrases" && lessonMeta.common_phrases?.length > 0 && (
              <section id="phrases" className="scroll-mt-24 rounded-2xl border border-neutral-700/40 bg-[#211d1c] p-5 shadow-[0_20px_55px_-35px_rgba(0,0,0,0.9)]">
                <h2 className="flex items-center gap-2 font-semibold text-white"><MessageCircle size={18} className="text-orange-400" />Phrases utiles</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {lessonMeta.common_phrases.map((phrase, index) => <motion.article whileHover={{ y: -4 }} key={phrase.phrase_id || phrase.original} className="group rounded-2xl border border-neutral-700/40 bg-neutral-900/60 p-4 transition hover:border-orange-500/50"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Phrase {index + 1}</span><span className="h-1.5 w-10 rounded-full bg-orange-500/30 transition group-hover:w-16 group-hover:bg-orange-500" /></div><p className="mt-3 text-base font-bold text-white">{phrase.original}</p>{phrase.phonetic_simple && <p className="mt-1 font-mono text-xs text-orange-300">{phrase.phonetic_simple}</p>}<p className="mt-2 text-sm text-neutral-300">{phrase.translation}</p>{phrase.context && <p className="mt-3 border-t border-neutral-700/40 pt-3 text-xs leading-5 text-neutral-500">{phrase.context}</p>}</motion.article>)}
                </div>
              </section>
            )}
            {activeSection === "grammaire" && lessonMeta.grammar_points?.length > 0 && (
              <section id="grammaire" className="scroll-mt-24 rounded-2xl border border-neutral-700/40 bg-[#211d1c] p-5 shadow-[0_20px_55px_-35px_rgba(0,0,0,0.9)]">
                <h2 className="flex items-center gap-2 font-semibold text-white"><Sparkles size={18} className="text-orange-400" />Points de grammaire</h2>
                <div className="mt-4 grid gap-4">
                  {lessonMeta.grammar_points.map((point, pointIndex) => <motion.article initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: pointIndex * .1 }} key={point.concept} className="rounded-2xl border border-neutral-700/40 bg-neutral-900/60 p-5"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-500 text-sm font-black text-white">{pointIndex + 1}</span><div className="min-w-0"><h3 className="text-base font-semibold text-white">{point.concept}</h3><p className="mt-2 text-sm leading-6 text-neutral-300">{point.explanation}</p></div></div>{point.rules?.length > 0 && <div className="mt-5 grid gap-2">{point.rules.map((rule, index) => <p key={rule} className="rounded-xl bg-neutral-800/80 p-3 text-xs leading-5 text-neutral-300"><strong className="mr-1 text-orange-400">Règle {index + 1}.</strong>{rule}</p>)}</div>}{point.examples?.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2">{point.examples.map((example) => <p key={example.structure} className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 text-xs text-neutral-300"><strong className="block text-white">{example.structure}</strong><span className="mt-1 block">{example.meaning}</span></p>)}</div>}</motion.article>)}
                </div>
              </section>
            )}
            {activeSection === "culture" && lessonMeta.cultural_notes?.length > 0 && (
              <section id="culture" className="scroll-mt-24 rounded-2xl border border-neutral-700/40 bg-[#211d1c] p-5 shadow-[0_20px_55px_-35px_rgba(0,0,0,0.9)]">
                <h2 className="flex items-center gap-2 font-semibold text-white"><Sparkles size={18} className="text-orange-400" />Notes culturelles</h2>
                <div className="mt-4 grid gap-3">{lessonMeta.cultural_notes.map((note, index) => <article key={note} className="rounded-2xl border border-neutral-700/40 bg-neutral-900/60 p-4 transition hover:border-orange-500/50"><span className="text-xs font-bold uppercase tracking-wider text-orange-400">Repère {index + 1}</span><p className="mt-2 text-sm leading-6 text-neutral-300">{note}</p></article>)}</div>
              </section>
            )}
          </div>
        )}
        {progressError && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {progressError}
          </div>
        )}
        {activeSection === "vocabulaire" && <section id="vocabulaire" className="scroll-mt-24">
        <AnimatePresence mode="wait">
          {phase === "learn" && (
            <motion.div key="learn-grid" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">Apprentissage / Vocabulaire</p><h2 className="mt-1 font-heading text-2xl font-bold text-white">Découvre les mots de la leçon</h2></div><span className="rounded-full border border-neutral-700/40 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300">{items.length} cartes</span></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {items.map((item, index) => <motion.article key={item.word_id || `${item.word}-${index}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.025, 0.35) }} className="flex min-h-[270px] flex-col rounded-2xl border border-neutral-700/40 bg-[#211d1c] p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.9)] transition hover:-translate-y-1 hover:border-orange-500/50">
                  <div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500/10 text-orange-400"><LanguageFlag language={language} size="sm" /></span><span className="text-xs text-neutral-500">{String(index + 1).padStart(2, "0")}</span></div>
                  <div className="flex flex-1 flex-col justify-center py-5"><h3 className="text-xl font-bold text-white">{item.translation_fr || item.word}</h3><p className="mt-2 text-lg font-medium text-neutral-400">{item.word}</p>{item.phonetic && <p className="mt-2 font-mono text-xs text-orange-300">/{item.phonetic}/</p>}{item.example_target && <p className="mt-3 line-clamp-2 text-xs italic text-neutral-500">“{item.example_target}”</p>}</div>
                  <div className="flex gap-2"><button type="button" onClick={() => playAudio(item)} className="flex-1 rounded-xl bg-orange-500 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400"><Volume2 size={15} className="mr-1.5 inline" />Écouter</button><button type="button" aria-label={`Écouter ${item.word}`} onClick={() => playAudio(item)} className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-800 text-neutral-200 transition hover:bg-neutral-700"><Volume2 size={16} /></button></div>
                </motion.article>)}
              </div>
              <div className="mt-6 flex justify-center"><button type="button" onClick={() => { setCardIdx(items.length - 1); setPhase("quiz"); setQuizIdx(0); }} className="rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:bg-orange-400">Commencer l’examen →</button></div>
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
          </section>}
        {activeSection && <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-10 rounded-[2rem] border border-neutral-700/40 bg-[#211d1c]/95 p-5 shadow-[0_24px_80px_-42px_rgba(0,0,0,.9)] lg:p-7">
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-border/70 pb-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">Espace d’apprentissage</p><h2 className="mt-1 font-heading text-2xl font-bold text-white">{activeSection === "vocabulaire" ? "Les mots à maîtriser" : activeSection === "dialogue" ? "Parler en situation" : activeSection === "exercices" ? "Le défi de la leçon" : "Les clés de la leçon"}</h2></div>
            <span className="rounded-full border border-neutral-700/40 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-400">{items.length} mots · {lessonMeta?.exercises?.length || 0} défis</span>
          </div>
          <div className="space-y-8">
            {activeSection === "vocabulaire" && <section id="vocabulaire-complet" className="scroll-mt-24">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground"><BookOpen size={18} className="text-primary" />Lexique complet</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.025, 0.3) }} key={item.word_id || `${item.word}-${index}`} className="group rounded-2xl border border-neutral-700/40 bg-neutral-900/70 p-4 transition duration-300 hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-[0_18px_45px_-28px_rgba(249,115,22,.7)]"><div className="flex items-start justify-between gap-2"><h4 className="font-heading text-lg font-bold text-white group-hover:text-orange-300">{item.word}</h4><span className="rounded-full bg-orange-500/10 px-2 py-1 text-[10px] font-bold text-orange-400">#{index + 1}</span></div>{item.phonetic && <p className="mt-2 font-mono text-xs text-orange-300">{item.phonetic}</p>}{item.phonetic_simple && <p className="text-xs text-neutral-500">{item.phonetic_simple}</p>}<p className="mt-2 text-sm text-neutral-300">{item.translation_fr}</p>{item.example_target && <div className="mt-3 rounded-xl bg-orange-500/5 p-3 text-xs"><p className="italic text-neutral-200">{item.example_target}</p><p className="mt-1 text-neutral-500">{item.example_fr}</p></div>}</motion.article>)}</div>
            </section>}
            {activeSection === "dialogue" && lessonMeta?.dialogue?.length > 0 && (() => {
              const dialogue = lessonMeta.dialogue;
              const speakers = [...new Set(dialogue.map((line) => line.speaker).filter(Boolean))].slice(0, 2);
              const playerRole = dialogueRole || speakers[1] || speakers[0];
              return <section id="dialogue" className="scroll-mt-24 overflow-hidden rounded-2xl border border-neutral-700/40 bg-gradient-to-br from-[#211d1c] to-orange-950/20 p-5 lg:p-7">
                <div className="relative mb-6 overflow-hidden rounded-2xl border border-orange-500/20 bg-orange-500/10 p-5"><div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-500/20 blur-2xl" /><div className="relative flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">Conversation à deux</p><h3 className="mt-2 font-heading text-2xl font-bold text-white">Dialogue complet</h3><p className="mt-2 text-sm leading-6 text-neutral-300">Les deux personnes dialoguent ensemble. Choisis ton rôle, écoute chaque voix et répète tes répliques.</p></div><MessageCircle size={32} className="shrink-0 text-orange-300" /></div><div className="mt-4 flex flex-wrap gap-2">{speakers.map((speaker) => <button key={speaker} type="button" onClick={() => setDialogueRole(speaker)} className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${playerRole === speaker ? "border-orange-400 bg-orange-500 text-white" : "border-neutral-700/40 bg-neutral-900/60 text-neutral-300 hover:border-orange-500/50"}`}>Je suis {speaker}</button>)}</div><div className="mt-5 h-2 overflow-hidden rounded-full bg-neutral-900/70"><div className="h-full w-full rounded-full bg-orange-500" /></div><p className="mt-2 text-right text-xs font-semibold text-orange-300">{dialogue.length} répliques · {speakers.length} interlocuteurs</p></div>
                <div className="space-y-4">{dialogue.map((line, index) => { const isPlayerLine = line.speaker === playerRole; return <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .06, .4) }} key={`${line.speaker}-${index}`} className={`flex ${isPlayerLine ? "justify-end" : "justify-start"}`}><div className={`max-w-2xl rounded-[1.5rem] border p-4 shadow-sm ${isPlayerLine ? "border-orange-500/30 bg-orange-500/15" : "border-neutral-700/40 bg-neutral-900/80"}`}><div className="flex items-center justify-between gap-4"><span className="text-xs font-bold uppercase tracking-wider text-orange-300">{line.speaker}</span><span className="text-[10px] text-neutral-500">{isPlayerLine ? "Ton rôle" : "Interlocuteur"}</span></div><p className="mt-3 text-base font-medium leading-7 text-white">{line.text}</p>{line.phonetic_simple && <p className="mt-2 font-mono text-xs text-orange-300">{line.phonetic_simple}</p>}<div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" onClick={() => speak(line.text)} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-orange-400"><Volume2 size={14} />Écouter</button><button type="button" onClick={() => setShowDialogueTranslation((value) => !value)} className="rounded-xl border border-neutral-700/40 bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-300 transition hover:border-orange-500/50">{showDialogueTranslation ? "Masquer" : "Traduction"}</button></div>{showDialogueTranslation && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 border-t border-neutral-700/40 pt-3 text-sm text-neutral-300">{line.translation}</motion.p>}</div></motion.article>; })}</div>
                <div className="mt-6 flex justify-center"><button type="button" onClick={() => { setDialogueRole(null); setDialogueIndex(0); setShowDialogueTranslation(false); }} className="rounded-xl border border-neutral-700/40 bg-neutral-900 px-5 py-3 text-sm font-bold text-neutral-300 transition hover:border-orange-500/50 hover:text-white">Rejouer la conversation</button></div>
              </section>;
            })()}
            {activeSection === "exercices" && lessonMeta?.exercises?.length > 0 && <section id="exercices" className="scroll-mt-24 overflow-hidden rounded-2xl border border-neutral-700/40 bg-gradient-to-br from-[#211d1c] to-orange-950/20 p-6"><div className="relative flex flex-col items-center text-center"><div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange-500/15 blur-2xl" /><div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-orange-500 text-white shadow-[0_0_35px_rgba(249,115,22,.35)]"><Target size={30} /></div><p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-orange-400">Évaluation de la leçon</p><h3 className="mt-2 font-heading text-2xl font-bold text-white">Prêt pour l’examen ?</h3><p className="mt-2 max-w-lg text-sm leading-6 text-neutral-400">Les questions restent cachées jusqu’au défi. Lance l’examen, gagne des points et mesure ta maîtrise.</p><div className="mt-5 flex flex-wrap justify-center gap-2">{[...new Set(lessonMeta.exercises.map((exercise) => exercise.type || "Exercice"))].map((type) => <span key={type} className="rounded-full border border-neutral-700/40 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300">{type}</span>)}<span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-300">{lessonMeta.exercises.length} exercices</span></div><Link to={`/examen/${langCode}/${lessonNum}`} className="mt-6 rounded-xl bg-orange-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:-translate-y-0.5 hover:bg-orange-400">Lancer le défi →</Link></div></section>}
          </div>
        </motion.section>}
      </main>
    </div>
  );
}