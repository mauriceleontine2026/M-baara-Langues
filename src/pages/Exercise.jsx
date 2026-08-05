import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ArrowLeft, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { getProgress } from "@/api/progressService";
import {
  getModuleById,
  getBeginnerCompletionStatus,
  isModuleAccessible,
  getLockMessageForModule,
  getCurriculumForLanguageExport,
} from "@/lib/curriculumGate";

const STOP_WORDS = new Set([
  "et", "les", "des", "dans", "pour", "avec", "une", "un", "sur", "son", "sa", "ses", "de", "du", "la", "le", "au", "aux", "par", "plus", "sans", "être", "avoir", "faire", "comme", "que", "qui", "est", "ou", "à", "a", "de", "des", "et", "une", "un"
]);

function extractKeywords(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-zà-ÿ\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .slice(0, 8);
}

export default function Exercise() {
  const { langCode, moduleId } = useParams();
  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState({});
  const [results, setResults] = useState({});

  const { user } = useAuth();
  const [completedLessons, setCompletedLessons] = useState([]);
  const [moduleLocked, setModuleLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");

  const module = useMemo(() => {
    const curriculum = getCurriculumForLanguageExport(langCode);
    for (const level of curriculum.levels) {
      const found = level.modules.find((item) => item.id === moduleId);
      if (found) return found;
    }
    return null;
  }, [moduleId, langCode]);

  const exercises = Array.isArray(module?.exerciseSeries) ? module.exerciseSeries : [];

  const currentExercise = exercises[currentIdx] || null;
  const progress = exercises.length > 0 ? ((currentIdx + 1) / exercises.length) * 100 : 0;
  const currentAnswer = responses[currentIdx] || "";
  const currentResult = results[currentIdx];
  const currentVerified = Boolean(currentResult);

  const validateResponse = () => {
    if (!currentExercise) return;
    const response = String(currentAnswer || "").trim();
    const keywords = extractKeywords(`${currentExercise.title} ${currentExercise.goal}`);
    const scoreHits = keywords.filter((word) => response.toLowerCase().includes(word)).length;
    const passed = response.length >= 20 && scoreHits >= 2;
    setResults((prev) => ({ ...prev, [currentIdx]: { passed, response } }));
  };

  const nextExercise = () => {
    if (currentIdx < exercises.length - 1) {
      setCurrentIdx((idx) => idx + 1);
    }
  };

  const restart = () => {
    setCurrentIdx(0);
    setResponses({});
    setResults({});
  };

  const score = Object.values(results).filter((result) => result?.passed).length;
  const average = exercises.length > 0 ? Math.round((score / exercises.length) * 100) : 0;

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

  const persistExerciseResult = () => {
    if (typeof window === "undefined") return;
    try {
      const payload = {
        score: average,
        completed: score === exercises.length,
        moduleId,
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(`mbaara-exercise-${langCode}-${moduleId}`, JSON.stringify(payload));
    } catch (e) {
      // ignore localStorage errors
    }
  };

  useEffect(() => {
    if (!user || !module || !langCode) return;
    getProgress()
      .then((data) => {
        const progress = Array.isArray(data) ? data.find((p) => p.language_code === langCode) : null;
        const completed = Array.isArray(progress?.completed_lessons)
          ? progress.completed_lessons.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
          : [];
        setCompletedLessons(completed);
      })
      .catch(() => setCompletedLessons([]));
  }, [user, langCode, module]);

  useEffect(() => {
    if (!module || !moduleId) return;
    const exerciseRecords = getExerciseRecords();
    const moduleInfo = getModuleById(moduleId, langCode);
    const beginnerStatus = getBeginnerCompletionStatus(completedLessons, exerciseRecords, 70, langCode);
    const accessible = moduleInfo ? isModuleAccessible(moduleId, completedLessons, exerciseRecords, langCode) : true;
    setModuleLocked(moduleInfo ? !accessible : false);
    setLockMessage(moduleInfo ? getLockMessageForModule(moduleInfo.levelIndex, moduleInfo.moduleIndex, moduleInfo.level, beginnerStatus.complete) : "");
  }, [module, moduleId, completedLessons, langCode]);

  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-md space-y-3">
          <p className="text-muted-foreground">Module introuvable.</p>
          <button onClick={() => navigate(-1)} className="text-primary text-sm font-medium">← Retour</button>
        </div>
      </div>
    );
  }

  if (moduleLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-lg rounded-3xl border border-amber-300/40 bg-amber-500/10 p-8">
          <p className="text-base font-semibold text-amber-900 mb-3">Accès restreint</p>
          <p className="text-sm text-amber-800 mb-6">{lockMessage || "Ce module est verrouillé tant que le niveau Débutant n'est pas achevé avec tous les exercices validés."}</p>
          <button onClick={() => navigate(`/apprendre/${langCode}`)} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Retour au curriculum</button>
        </div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-md space-y-3">
          <p className="text-muted-foreground">Aucune série d’exercices disponible pour ce module.</p>
          <button onClick={() => navigate(-1)} className="text-primary text-sm font-medium">← Retour</button>
        </div>
      </div>
    );
  }

  const isCompleted = currentIdx === exercises.length - 1 && currentVerified;

  useEffect(() => {
    if (isCompleted && score === exercises.length) {
      persistExerciseResult();
    }
  }, [isCompleted, score, exercises.length, langCode, moduleId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Retour
          </button>
          <Link to={`/apprendre/${langCode}`} className="text-sm text-primary font-medium">Voir la langue</Link>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 mb-6">
          <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            <span>Pratique interactive</span>
            <span>{currentIdx + 1}/{exercises.length}</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-4">
            <h1 className="text-xl font-bold font-heading">{module.label}</h1>
            <p className="text-sm text-muted-foreground mt-1">Langue : {langCode || "sélectionnée"}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{currentExercise.type}</div>
            <h2 className="text-lg font-bold mt-1">{currentExercise.title}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{currentExercise.goal}</p>

          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
            Rédige ta réponse courte
          </label>
          <textarea
            value={currentAnswer}
            onChange={(event) => setResponses((prev) => ({ ...prev, [currentIdx]: event.target.value }))}
            className="w-full min-h-[140px] rounded-2xl border border-border bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Exemple : Je peux demander une direction, comparer deux objets et m'identifier en quelques phrases."
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={validateResponse}
              className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
            >
              Vérifier
            </button>
            <button
              onClick={nextExercise}
              disabled={!currentVerified || currentIdx >= exercises.length - 1}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Leçon suivante
            </button>
          </div>

          {currentVerified && (
            <div className="mt-4 rounded-2xl bg-secondary/50 px-3 py-3 text-sm">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <CheckCircle2 size={16} className="text-green-500" />
                {currentResult?.passed
                  ? "Bonne structure de réponse. Tu peux passer à l’exercice suivant."
                  : "Essaie d’ajouter plus de détail pour mieux répondre à la consigne."}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">Progression</div>
              <div className="text-sm font-semibold text-foreground">{score}/{exercises.length} exercices validés</div>
            </div>
            <button onClick={restart} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold">
              <RotateCcw size={14} /> Recommencer
            </button>
          </div>

          {isCompleted && (
            <div className="mt-4 rounded-2xl bg-primary/10 p-3 text-sm text-foreground">
              <div className="font-semibold mb-1">Série terminée.</div>
              <div>Tu as obtenu une moyenne de {average}% sur cette série. Ce résultat est maintenant enregistré pour déverrouiller la suite du parcours.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
