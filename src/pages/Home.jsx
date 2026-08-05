import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getLanguages } from "@/api/languageService";
import { getProgress } from "@/api/progressService";
import { BookOpen, GraduationCap, Mic, Trophy, ArrowRight, Flame, Star, Sparkles } from "lucide-react";

// public logo at /logo.png

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const [languages, setLanguages] = useState(/** @type {any[]} */ ([]));
  const [progresses, setProgresses] = useState(/** @type {any[]} */ ([]));

  useEffect(() => {
    getLanguages().then((data) => setLanguages(Array.isArray(data) ? data : [])).catch(() => setLanguages([]));
  }, []);

  useEffect(() => {
    const refreshProgress = () => {
      if (user) {
        getProgress().then((data) => setProgresses(Array.isArray(data) ? data : [])).catch(() => setProgresses([]));
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

  const safeProgresses = /** @type {any[]} */ (Array.isArray(progresses) ? progresses : []);
  const safeLanguages = /** @type {any[]} */ (Array.isArray(languages) ? languages : []);
  const totalXP = safeProgresses.reduce((s, p) => s + (p.xp || 0), 0);
  const maxStreak = safeProgresses.reduce((s, p) => Math.max(s, p.streak || 0), 0);
  const activeLangs = safeProgresses.length;

  const actions = [
    { to: "/apprendre", label: "Commencer une leçon", icon: BookOpen, color: "text-orange-500" },
    { to: "/tuteur", label: "Tuteur IA Kôrô", icon: GraduationCap, color: "text-purple-500" },
    { to: "/contribuer", label: "Contribuer", icon: Mic, color: "text-pink-500" },
    { to: "/revision", label: "Révision SRS", icon: Trophy, color: "text-yellow-500" },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      {/* Welcome card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-card to-card border border-border p-8 mb-6">
        
        <div className="flex items-center gap-3 mb-4">
          <img src="/logo.png" alt="M'baara" className="w-20 h-20 rounded-full object-cover shadow-md ring-2 ring-primary/30" />
          <div>
            <div className="font-heading font-bold text-lg text-foreground leading-none">M'BAARA</div>
            <span className="text-xs text-primary font-semibold">Langues</span>
          </div>
        </div>
        <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-2">
          Bienvenue sur M'baara Langues !{user?.full_name ? ` ${user.full_name}` : ""}
        </h1>
        <p className="text-muted-foreground mb-5">Commencez votre voyage linguistique africain et international</p>
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-1.5 bg-secondary/60 rounded-full px-3 py-1.5 text-sm">
            <Flame size={14} className="text-primary" /> {maxStreak} jours série
          </div>
          <div className="flex items-center gap-1.5 bg-secondary/60 rounded-full px-3 py-1.5 text-sm">
            <Star size={14} className="text-blue-500" /> {totalXP} XP
          </div>
          <div className="flex items-center gap-1.5 bg-secondary/60 rounded-full px-3 py-1.5 text-sm">
            <BookOpen size={14} className="text-green-500" /> {activeLangs} langues
          </div>
        </div>
        <Link to="/apprendre"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-3 rounded-xl hover:opacity-90 transition shadow-lg shadow-primary/20">
          Choisir une langue <ArrowRight size={18} />
        </Link>
      </div>

      {/* Action grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {actions.map(({ to, label, icon: Icon, color }) => (
          <Link key={to} to={to}
            className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-lg transition-all">
            <div className={`mb-3 ${color}`}><Icon size={28} /></div>
            <div className="font-semibold text-foreground text-sm">{label}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 group-hover:text-primary transition">
              Ouvrir <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>

      {/* Kôrô AI Tutor featured card */}
      <Link to="/tuteur"
        className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/20 via-card to-primary/15 border border-border p-6 mb-6 hover:border-purple-400/40 transition group">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <img src="/logo.png" alt="Kôrô" className="w-16 h-16 rounded-full object-cover shadow-lg ring-2 ring-purple-400/30" />
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-card" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap size={18} className="text-purple-400" />
              <h2 className="font-heading text-xl font-bold text-foreground">Kôrô — Tuteur IA</h2>
            </div>
            <p className="text-sm text-muted-foreground">Converse vocalement, pose tes questions, apprends à ton rythme avec ton assistant intelligent</p>
          </div>
          <ArrowRight size={24} className="text-muted-foreground group-hover:text-purple-400 group-hover:translate-x-1 transition shrink-0" />
        </div>
      </Link>

      {/* Studio card */}
      <Link to="/studio"
        className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/20 via-card to-primary/15 border border-border p-6 mb-6 hover:border-primary/40 transition group">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-purple-400" />
              <h2 className="font-heading text-xl font-bold text-foreground">Studio IA &amp; Data Science</h2>
            </div>
            <p className="text-sm text-muted-foreground">Tuteur vocal · accent · scan OCR · ligues en direct</p>
          </div>
          <ArrowRight size={24} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition" />
        </div>
      </Link>

      {/* Language families */}
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground mb-4">Familles de langues</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {(Array.isArray(languages) ? languages.slice(0, 6) : []).map(lang => (
            <Link key={lang.id} to={`/apprendre/${lang.code}`}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag_emoji}</span>
                <div className="min-w-0">
                  <div className="font-semibold text-foreground text-sm truncate">{lang.name_fr}</div>
                  <div className="text-xs text-muted-foreground truncate">{lang.region}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}