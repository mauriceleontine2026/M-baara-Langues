// @ts-nocheck
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getLanguages, getVocabularyForLanguage, getLessonsForLanguage } from "@/api/languageService";
import { getProgress } from "@/api/progressService";
import { ArrowLeft, ArrowRight, Lock, CheckCircle, BookOpen, Download, Trash2, WifiOff, Loader2 } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { downloadLanguageOffline, isLanguageDownloaded, removeLanguageOffline, getOfflineVocab, getOfflineLanguages } from "@/lib/offlineStorage";

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
    if (user) {
      getProgress()
        .then((data) => setProgresses(Array.isArray(data) ? data : []))
        .catch(() => setProgresses([]));
    }
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

  // Detail view
  if (langCode) {
    const lang = safeLanguages.find(l => l.code === langCode);
    if (!lang) return <div className="p-10 text-center text-muted-foreground">Chargement...</div>;

    const lessonInfo = {};
    safeLessons.forEach((lesson) => {
      if (lesson?.lesson_number != null) {
        lessonInfo[lesson.lesson_number] = lesson;
      }
    });

    /** @type {{ [lesson: number]: any[] }} */
    const byLesson = {};
    safeItems.forEach(i => {
      const n = i?.lesson_number || 1;
      if (!byLesson[n]) byLesson[n] = [];
      byLesson[n].push(i);
    });
    const lessonNums = Array.from(new Set([
      ...safeItems.map(i => i?.lesson_number || 1),
      ...safeLessons.map(l => l?.lesson_number || 1),
    ])).sort((a, b) => a - b);
    const prog = safeProgresses.find(p => p.language_code === langCode);
    const completed = Array.isArray(prog?.completed_lessons) ? prog.completed_lessons.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0) : [];
    const sortedCompleted = [...new Set(completed)].sort((a, b) => a - b);
    let currentLesson = 1;
    for (const lessonNumber of sortedCompleted) {
      if (lessonNumber === currentLesson) {
        currentLesson += 1;
      } else if (lessonNumber > currentLesson) {
        break;
      }
    }

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
            <span className="text-5xl">{lang.flag_emoji}</span>
            <div>
              <h1 className="font-heading text-2xl font-bold">{lang.name_fr}</h1>
              <p className="text-white/80 text-sm">{lang.description || lang.region}</p>
            </div>
          </div>
          {prog && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>Progression</span><span>{completed.length}/{lessonNums.length} leçons</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div className="h-2 bg-white rounded-full" style={{ width: `${Math.min(100, (completed.length / Math.max(1, lessonNums.length)) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>

        {lessonNums.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
            <p>Pas encore de leçons disponibles</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lessonNums.map(num => {
              const lessonItems = byLesson[num] || [];
              const isDone = completed.includes(num);
              const isUnlocked = num <= currentLesson;
              return (
                <Link key={num} to={isUnlocked ? `/lecon/${langCode}/${num}` : "#"}
                  onClick={e => !isUnlocked && e.preventDefault()}
                  className={`flex items-center gap-4 bg-card border rounded-2xl p-4 transition ${
                    isUnlocked ? "border-border hover:border-primary/40 hover:shadow-md" : "border-border opacity-50 cursor-not-allowed"
                  }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isDone ? "bg-green-500 text-white" : isUnlocked ? "text-white" : "bg-secondary text-muted-foreground"
                  }`} style={isUnlocked && !isDone ? { background: lang.color } : {}}>
                    {isDone ? <CheckCircle size={20} /> : isUnlocked ? <span className="font-bold text-sm">{num}</span> : <Lock size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-sm">{lessonInfo[num]?.module?.theme || lessonInfo[num]?.title_fr || lessonInfo[num]?.title || `Leçon ${num}`}</div>
                    <div className="text-xs text-muted-foreground">
                      {lessonInfo[num]?.module?.description
                        ? lessonInfo[num]?.module?.description
                        : lessonInfo[num]?.description
                        ? lessonInfo[num]?.description
                        : lessonInfo[num]?.content
                        ? lessonInfo[num]?.content
                        : lessonItems.length > 0
                        ? `${lessonItems.length} mots · ${[...new Set(lessonItems.map(i => i.category))].slice(0, 3).join(", ")}`
                        : "Aucun vocabulaire disponible pour le moment"}
                    </div>
                  </div>
                  {isUnlocked && <ArrowRight size={18} className="text-muted-foreground" />}
                </Link>
              );
            })}
          </div>
        )}
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
                  <span className="text-3xl">{lang.flag_emoji}</span>
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