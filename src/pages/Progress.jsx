import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getLanguages } from "@/api/languageService";
import { getProgress } from "@/api/progressService";
import { Award, BookOpen, Flame, Star, TrendingUp, ArrowRight } from "lucide-react";

export default function Progress() {
  const { user } = useAuth();
  const [progresses, setProgresses] = useState(/** @type {any[]} */ ([]));
  const [languages, setLanguages] = useState(/** @type {any[]} */ ([]));

  useEffect(() => {
    getLanguages().then(data => setLanguages(Array.isArray(data) ? data : [])).catch(() => setLanguages([]));
  }, []);

  useEffect(() => {
    const refreshProgress = () => {
      if (user) {
        getProgress().then(data => setProgresses(Array.isArray(data) ? data : [])).catch(() => setProgresses([]));
      } else {
        setProgresses([]);
      }
    };

    refreshProgress();
    window.addEventListener("mbaara-progress-updated", refreshProgress);
    window.addEventListener("mbaara-user-updated", refreshProgress);

    return () => {
      window.removeEventListener("mbaara-progress-updated", refreshProgress);
      window.removeEventListener("mbaara-user-updated", refreshProgress);
    };
  }, [user]);

  /** @type {any[]} */
  const safeProgresses = Array.isArray(progresses) ? progresses : [];
  /** @type {any[]} */
  const safeLanguages = Array.isArray(languages) ? languages : [];
  const totalXP = safeProgresses.reduce((s, p) => s + (p.xp || 0), 0);
  const maxStreak = safeProgresses.reduce((s, p) => Math.max(s, p.streak || 0), 0);
  const activeLangs = safeProgresses.length;
  const totalLessons = safeProgresses.reduce((s, p) => s + (p.completed_lessons?.length || 0), 0);

  const rank = totalLessons < 10 ? "Débutant" : totalLessons < 30 ? "Apprenti" : totalLessons < 60 ? "Intermédiaire" : "Avancé";
  const nextRank = totalLessons < 10 ? "Apprenti" : totalLessons < 30 ? "Intermédiaire" : "Avancé";
  const toNext = totalLessons < 10 ? 10 - totalLessons : totalLessons < 30 ? 30 - totalLessons : 60 - totalLessons;

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <h1 className="font-heading text-3xl font-bold text-foreground mb-1">Ma Progression</h1>
      <p className="text-muted-foreground mb-6">Suivez votre avancement dans toutes les langues</p>

      {/* Rank card */}
      <div className="bg-gradient-to-br from-purple-600/20 via-card to-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-primary flex items-center justify-center">
            <Award className="text-white" size={28} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Votre rang actuel</p>
            <h2 className="font-heading text-2xl font-bold text-foreground">{rank}</h2>
            <p className="text-sm text-muted-foreground">Encore {toNext} leçons pour devenir '{nextRank}'</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-primary" style={{ width: `${Math.min(100, (totalLessons / 60) * 100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 text-right">{totalLessons} leçons totales</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <BookOpen className="mx-auto mb-2 text-green-500" size={24} />
          <div className="text-2xl font-bold text-foreground">{totalLessons}</div>
          <div className="text-xs text-muted-foreground">Leçons maîtrisées</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <Flame className="mx-auto mb-2 text-primary" size={24} />
          <div className="text-2xl font-bold text-foreground">{maxStreak}</div>
          <div className="text-xs text-muted-foreground">Streak max (jours)</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <Star className="mx-auto mb-2 text-blue-500" size={24} />
          <div className="text-2xl font-bold text-foreground">{activeLangs}</div>
          <div className="text-xs text-muted-foreground">Langues actives</div>
        </div>
      </div>

      {/* Progression by language */}
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp size={18} className="text-muted-foreground" />
        <h2 className="font-heading text-xl font-bold text-foreground">Progression par langue</h2>
      </div>

      {safeProgresses.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <BookOpen size={40} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-semibold text-foreground mb-1">Aucune progression encore</p>
          <p className="text-sm text-muted-foreground mb-4">Commencez à apprendre une langue pour voir votre progression ici</p>
          <Link to="/apprendre" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-3 rounded-xl hover:opacity-90 transition">
            Choisir une langue <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {safeProgresses.map(p => {
            const lang = safeLanguages.find(l => l.code === p.language_code);
            if (!lang) return null;
            const completed = p.completed_lessons?.length || 0;
            return (
              <div key={p.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <span className="text-2xl">{lang.flag_emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold text-foreground text-sm">{lang.name_fr}</div>
                  <div className="w-full bg-secondary rounded-full h-1.5 mt-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (completed / Math.max(1, lang.total_lessons || 20)) * 100)}%`, background: lang.color }} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-foreground">{p.xp || 0} XP</div>
                  <div className="text-xs text-muted-foreground">{completed} leçons</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}