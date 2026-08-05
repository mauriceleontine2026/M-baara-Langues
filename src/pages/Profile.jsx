import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getLanguages } from "@/api/languageService";
import { getProgress } from "@/api/progressService";
import { logout as logoutService, updateMe } from "@/api/authService";
import { listContributions } from "@/api/contributionService";
import { uploadFile } from "@/api/uploadService";
import { useTheme } from "@/contexts/ThemeContext";
import { Mail, Shield, Flame, Star, BookOpen, Globe, LogOut, Clock, CheckCircle, XCircle, Hourglass, Award, Settings, Camera, Loader2 } from "lucide-react";
// public logo at /logo.png

export default function Profile() {
  const [progresses, setProgresses] = useState(/** @type {any[]} */ ([]));
  const [languages, setLanguages] = useState(/** @type {any[]} */ ([]));
  const [contributions, setContributions] = useState(/** @type {any[]} */ ([]));
  const { theme, toggleTheme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const { user, updateUser } = useAuth();

  useEffect(() => {
    getLanguages()
      .then((data) => setLanguages(Array.isArray(data) ? data : []))
      .catch(() => setLanguages([]));
    if (user) {
      listContributions()
        .then((data) => setContributions(Array.isArray(data) ? data : []))
        .catch(() => setContributions([]));
    }
  }, [user]);

  useEffect(() => {
    const refreshProgress = () => {
      if (user) {
        getProgress()
          .then((data) => setProgresses(Array.isArray(data) ? data : []))
          .catch(() => setProgresses([]));
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

  const totalXP = Array.isArray(progresses) ? progresses.reduce((s, p) => s + (p.xp || 0), 0) : 0;
  const maxStreak = Array.isArray(progresses) ? progresses.reduce((s, p) => Math.max(s, p.streak || 0), 0) : 0;
  const activeLangs = Array.isArray(progresses) ? progresses.length : 0;
  const totalLessons = Array.isArray(progresses) ? progresses.reduce((s, p) => s + (p.completed_lessons?.length || 0), 0) : 0;

  const achievements = [
    { icon: "🎯", title: "Premiers pas", desc: "1 leçon complétée", unlocked: totalLessons >= 1 },
    { icon: "📚", title: "Assidu", desc: "10 leçons", unlocked: totalLessons >= 10 },
    { icon: "🏆", title: "Expert", desc: "30 leçons", unlocked: totalLessons >= 30 },
    { icon: "🌍", title: "Polyglotte", desc: "3 langues", unlocked: activeLangs >= 3 },
    { icon: "🔥", title: "Régulier", desc: "7 jours de série", unlocked: maxStreak >= 7 },
    { icon: "⭐", title: "Chasseur d'XP", desc: "500 XP", unlocked: totalXP >= 500 },
    { icon: "📝", title: "Contributeur", desc: "1 contribution", unlocked: contributions.length >= 1 },
    { icon: "💎", title: "Bienfaiteur", desc: "5 contributions", unlocked: contributions.length >= 5 },
  ];

  const handlePhotoUpload = async (/** @type {import("react").ChangeEvent<HTMLInputElement>} */ e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/$/, "");
      const uploadData = await uploadFile(file);
      const file_url = uploadData?.file_url || uploadData?.url;
      if (!file_url) throw new Error("Aucun URL de fichier renvoyé.");
      const absolute_url = file_url.startsWith("/") ? `${apiBase}${file_url}` : file_url;
      await updateMe({ photo_url: absolute_url });
      updateUser({ photo_url: absolute_url });
    } catch (err) {
      const errorValue = /** @type {unknown} */ (err);
      const message = errorValue instanceof Error ? errorValue.message : String(errorValue);
      alert("Erreur lors de l'upload : " + message);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await logoutService();
    window.location.href = "/login";
  };

  if (!user) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const initial = (user.full_name || user.email || "?")[0].toUpperCase();

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      {/* Header card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-card to-card border border-border p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden">
              {user.photo_url ? (
                <img src={user.photo_url} alt={user.full_name || "Profil"} className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition disabled:opacity-60 border-2 border-card"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-2xl font-bold text-foreground">{user.full_name || "Apprenant"}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Mail size={14} /> {user.email}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${user.role === "admin" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                <Shield size={12} /> {user.role === "admin" ? "Administrateur" : "Apprenant"}
              </span>
            </div>
          </div>
          <img src="/logo.png" alt="M'baara" className="w-14 h-14 rounded-full object-cover shadow-md ring-2 ring-primary/20 hidden sm:block" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Star, color: "text-blue-500", value: totalXP, label: "XP totaux" },
          { icon: Flame, color: "text-primary", value: maxStreak, label: "Série max (j)" },
          { icon: BookOpen, color: "text-green-500", value: totalLessons, label: "Leçons" },
          { icon: Globe, color: "text-purple-500", value: activeLangs, label: "Langues" },
        ].map(({ icon: Icon, color, value, label }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <Icon className={`mx-auto mb-1.5 ${color}`} size={22} />
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Award size={18} className="text-primary" />
          <h2 className="font-heading text-xl font-bold text-foreground">Mes badges</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {achievements.map((a) => (
            <div key={a.title} className={`rounded-2xl p-4 text-center border transition ${a.unlocked ? "bg-card border-primary/30" : "bg-secondary/30 border-border opacity-50"}`}>
              <div className={`text-3xl mb-1.5 ${a.unlocked ? "" : "grayscale"}`}>{a.icon}</div>
              <div className="text-xs font-semibold text-foreground">{a.title}</div>
              <div className="text-[10px] text-muted-foreground">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* My contributions */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={18} className="text-muted-foreground" />
          <h2 className="font-heading text-xl font-bold text-foreground">Mes contributions</h2>
        </div>
        {contributions.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Tu n'as pas encore contribué.</p>
            <Link to="/contribuer" className="text-primary text-sm font-medium hover:underline">Contribuer maintenant →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {contributions.map(c => {
              const lang = languages.find(l => l.code === c.language_code);
              return (
                <div key={c.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                  <span className="text-xl">{lang?.flag_emoji || "🌍"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm">{c.word} <span className="text-muted-foreground">→ {c.translation_fr}</span></div>
                    <div className="text-xs text-muted-foreground">{lang?.name_fr || c.language_code}</div>
                  </div>
                  {c.status === "pending" && <span className="text-xs text-yellow-500 flex items-center gap-1"><Hourglass size={12} /> En attente</span>}
                  {c.status === "approved" && <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircle size={12} /> Validé</span>}
                  {c.status === "rejected" && <span className="text-xs text-red-500 flex items-center gap-1"><XCircle size={12} /> Refusé</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-muted-foreground" />
          <h2 className="font-heading text-lg font-bold text-foreground">Paramètres</h2>
        </div>
        <button onClick={toggleTheme}
          className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-secondary/50 hover:bg-secondary transition mb-2">
          <span className="text-sm font-medium text-foreground">Thème {theme === "dark" ? "sombre" : "clair"}</span>
          <span className="text-xs text-primary">Basculer</span>
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-500 font-medium text-sm hover:bg-red-500/20 transition">
          <LogOut size={16} /> Se déconnecter
        </button>
      </div>
    </div>
  );
}