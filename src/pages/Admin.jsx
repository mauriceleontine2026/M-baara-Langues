import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { createLanguage, getLanguages, getAllVocabulary, getAllLessons } from "@/api/languageService";
import { listUsers } from "@/api/userService";
import { listContributions } from "@/api/contributionService";
import { Link } from "react-router-dom";
import { Plus, Globe, BookOpen, Users, FileText, Clock, ShieldAlert, Sparkles } from "lucide-react";
import AdminVocabulary from "@/components/admin/AdminVocabulary";
import AdminContributions from "@/components/admin/AdminContributions";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminLessons from "@/components/admin/AdminLessons";
import AdminAIGenerator from "@/components/admin/AdminAIGenerator";

export default function Admin() {
  const [tab, setTab] = useState("overview");
  const [languages, setLanguages] = useState(/** @type {any[]} */ ([]));
  const [vocabCount, setVocabCount] = useState(0);
  const [users, setUsers] = useState(/** @type {any[]} */ ([]));
  const [contribCount, setContribCount] = useState(0);
  const [lessonCount, setLessonCount] = useState(0);
  const { user, isLoadingAuth } = useAuth();

  useEffect(() => {
    getLanguages()
      .then((data) => setLanguages(Array.isArray(data) ? data : []))
      .catch(() => setLanguages([]));

    getAllVocabulary()
      .then((data) => setVocabCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setVocabCount(0));

    listUsers()
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));

    listContributions()
      .then((data) => setContribCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setContribCount(0));

    getAllLessons()
      .then((data) => setLessonCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setLessonCount(0));
  }, []);

  const handleAddLanguage = async () => {
    const code = prompt("Code de la langue (ex: bambara) :");
    const name = prompt("Nom de la langue :");
    const region = prompt("Région/Pays :");
    if (!code || !name) return;
    try {
      await createLanguage({ code, name, name_fr: name, region, status: "active", color: "#E8A838", flag_emoji: "🌍", total_lessons: 0 });
      getLanguages()
        .then((data) => setLanguages(Array.isArray(data) ? data : []))
        .catch(() => setLanguages([]));
    } catch {
      // Ignore create failure for now
    }
  };

  if (isLoadingAuth) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!user || user.role !== "admin") {
    return (
      <div className="p-6 lg:p-10 max-w-md mx-auto text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <ShieldAlert className="text-red-500" size={32} />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Accès refusé</h1>
        <p className="text-muted-foreground mb-4">Cette page est réservée aux administrateurs.</p>
        <Link to="/" className="text-primary font-medium hover:underline">← Retour à l'accueil</Link>
      </div>
    );
  }

  const TABS = [
    { val: "overview", label: "Vue d'ensemble", icon: Globe },
    { val: "vocab", label: "Vocabulaire", icon: BookOpen },
    { val: "langs", label: "Langues", icon: Plus },
    { val: "contributions", label: "Contributions", icon: FileText },
    { val: "users", label: "Utilisateurs", icon: Users },
    { val: "lessons", label: "Leçons", icon: Clock },
    { val: "ai", label: "Générateur IA", icon: Sparkles },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <h1 className="font-heading text-3xl font-bold text-foreground mb-1">Administration</h1>
      <p className="text-muted-foreground mb-6">Gérer le contenu et les utilisateurs de Mǎa-kwɛ́lî</p>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {[
          { icon: Globe, color: "text-primary", value: languages.length, label: "Langues" },
          { icon: BookOpen, color: "text-blue-500", value: vocabCount, label: "Mots" },
          { icon: Users, color: "text-green-500", value: users.length, label: "Users" },
          { icon: FileText, color: "text-yellow-500", value: contribCount, label: "Contribs" },
          { icon: Clock, color: "text-purple-500", value: lessonCount, label: "Leçons" },
        ].map(({ icon: Icon, color, value, label }) => (
          <div key={label} className="bg-card rounded-xl p-3 text-center border border-border">
            <Icon className={`mx-auto mb-1 ${color}`} size={18} />
            <div className="text-xl font-bold text-foreground">{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-secondary p-1 rounded-xl mb-5 overflow-x-auto">
        {TABS.map(({ val, label, icon: Icon }) => (
          <button key={val} onClick={() => setTab(val)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${tab === val ? "bg-card shadow text-primary" : "text-muted-foreground"}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-sm">Langues et contenu</h3>
          {languages.map(lang => (
            <div key={lang.id} className="bg-card rounded-xl p-4 border border-border flex items-center gap-3">
              <span className="text-2xl">{lang.flag_emoji}</span>
              <div className="flex-1">
                <div className="font-semibold text-foreground text-sm">{lang.name_fr}</div>
                <div className="text-xs text-muted-foreground">{lang.region} · {lang.status === "active" ? "✅ Actif" : "⏳ Bientôt"}</div>
              </div>
              <Link to={`/apprendre/${lang.code}`} className="text-xs text-primary hover:underline">Voir</Link>
            </div>
          ))}
        </div>
      )}

      {tab === "vocab" && <AdminVocabulary languages={languages} />}
      {tab === "contributions" && <AdminContributions languages={languages} />}
      {tab === "users" && <AdminUsers />}
      {tab === "lessons" && <AdminLessons languages={languages} />}
      {tab === "ai" && <AdminAIGenerator languages={languages} />}

      {tab === "langs" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm">Gérer les langues</h3>
            <button onClick={handleAddLanguage} className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition">
              <Plus size={14} /> Nouvelle langue
            </button>
          </div>
          <div className="space-y-2">
            {languages.map(lang => (
              <div key={lang.id} className="bg-card rounded-xl p-4 border border-border flex items-center gap-3">
                <span className="text-2xl">{lang.flag_emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold text-foreground text-sm">{lang.name_fr}</div>
                  <div className="text-xs text-muted-foreground">{lang.code} · {lang.family} · {lang.region}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lang.status === "active" ? "bg-green-500/15 text-green-600 dark:text-green-400" : "bg-secondary text-muted-foreground"}`}>
                  {lang.status === "active" ? "Actif" : "Bientôt"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}