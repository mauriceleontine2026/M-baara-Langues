import { useEffect, useState } from "react";
import { createLesson, getLessonsForLanguage, updateLesson } from "@/api/languageService";
import { Plus, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";

const normalizeLessonLevel = (value) => {
  const raw = String(value || "").trim().toUpperCase();
  if (raw === "A1" || raw === "A2") return "Débutant";
  if (raw === "B1") return "Intermédiaire";
  if (raw === "B2" || raw === "C1" || raw === "C2") return "Avancé";
  if (raw === "DEBUTANT" || raw === "DÉBUTANT") return "Débutant";
  if (raw === "INTERMEDIAIRE" || raw === "INTERMÉDIAIRE") return "Intermédiaire";
  if (raw === "AVANCE" || raw === "AVANCÉ") return "Avancé";
  return value || "Débutant";
};

export default function AdminLessons({ languages }) {
  const [lessons, setLessons] = useState([]);
  const [lang, setLang] = useState("");
  const [newLesson, setNewLesson] = useState({ title: "", title_fr: "", level: "Débutant", order: 1, type: "vocabulary", description: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [expandedLessonId, setExpandedLessonId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editLessonDraft, setEditLessonDraft] = useState({ theme: "", niveau: "Débutant", type: "vocabulary", order: 1, description: "", title_fr: "" });

  useEffect(() => {
    if (languages.length > 0 && !lang) setLang(languages[0].code);
  }, [languages]);

  useEffect(() => {
    if (lang) getLessonsForLanguage(lang).then(setLessons).catch(() => setLessons([]));
  }, [lang]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!lang) return;
    setSaving(true); setMsg("");
    try {
      await createLesson({ ...newLesson, language_code: lang, lesson_number: newLesson.order });
      setMsg("✅ Leçon créée !");
      setNewLesson({ ...newLesson, title: "", title_fr: "", description: "" });
      getLessonsForLanguage(lang).then(setLessons).catch(() => setLessons([]));
    } catch (err) {
      setMsg("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const refreshLessons = () => {
    getLessonsForLanguage(lang).then(setLessons).catch(() => setLessons([]));
  };

  const togglePublish = async (l) => {
    await updateLesson(l.id, { published: !l.published });
    refreshLessons();
  };

  const startEditLesson = (lesson) => {
    const module = lesson.module || {};
    setEditingLessonId(lesson.id);
    setEditLessonDraft({
      theme: module.theme || lesson.title || "",
      niveau: normalizeLessonLevel(module.niveau || lesson.level || "Débutant"),
      type: lesson.type || "vocabulary",
      order: lesson.order || lesson.lesson_number || 1,
      description: module.description || lesson.description || lesson.content || "",
      title_fr: lesson.title_fr || "",
    });
  };

  const cancelEditLesson = () => {
    setEditingLessonId(null);
    setEditLessonDraft({ theme: "", niveau: "Débutant", type: "vocabulary", order: 1, description: "", title_fr: "" });
  };

  const handleEditLessonChange = (field, value) => {
    setEditLessonDraft((draft) => ({ ...draft, [field]: value }));
  };

  const saveLessonModule = async (lesson) => {
    setSaving(true);
    setMsg("");
    try {
      await updateLesson(lesson.id, {
        title: editLessonDraft.theme,
        title_fr: editLessonDraft.title_fr,
        level: editLessonDraft.niveau,
        type: editLessonDraft.type,
        order: editLessonDraft.order,
        description: editLessonDraft.description,
      });
      setMsg("✅ Module mis à jour !");
      cancelEditLesson();
      refreshLessons();
    } catch (err) {
      setMsg("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full border border-border bg-background rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
  const labelCls = "text-xs font-medium text-muted-foreground mb-1 block";

  return (
    <div className="space-y-5">
      {/* Language selector */}
      <select value={lang} onChange={e => setLang(e.target.value)} className="w-full sm:w-auto border border-border bg-card rounded-xl px-4 py-2.5 text-sm">
        {languages.map(l => <option key={l.code} value={l.code}>{l.flag_emoji} {l.name_fr}</option>)}
      </select>

      {/* Create form */}
      <form onSubmit={handleSave} className="bg-card rounded-2xl p-5 border border-border space-y-3">
        <h3 className="font-semibold text-foreground text-sm flex items-center gap-2"><Plus size={16} /> Nouvelle leçon</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Titre (langue cible) *</label>
            <input value={newLesson.title} onChange={e => setNewLesson({ ...newLesson, title: e.target.value })} className={inputCls} required placeholder="Ex: Salutations" />
          </div>
          <div>
            <label className={labelCls}>Titre français</label>
            <input value={newLesson.title_fr} onChange={e => setNewLesson({ ...newLesson, title_fr: e.target.value })} className={inputCls} placeholder="Ex: Les salutations" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Niveau</label>
            <select value={newLesson.level} onChange={e => setNewLesson({ ...newLesson, level: e.target.value })} className={inputCls}>
              <option value="Débutant">Débutant</option>
              <option value="Intermédiaire">Intermédiaire</option>
              <option value="Avancé">Avancé</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Ordre</label>
            <input type="number" min="1" value={newLesson.order} onChange={e => setNewLesson({ ...newLesson, order: parseInt(e.target.value) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select value={newLesson.type} onChange={e => setNewLesson({ ...newLesson, type: e.target.value })} className={inputCls}>
              <option value="vocabulary">Vocabulaire</option>
              <option value="phrases">Phrases</option>
              <option value="letters">Lettres</option>
              <option value="sounds">Sons</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <input value={newLesson.description} onChange={e => setNewLesson({ ...newLesson, description: e.target.value })} className={inputCls} placeholder="Description de la leçon" />
        </div>
        {msg && <p className="text-sm text-center">{msg}</p>}
        <button type="submit" disabled={saving} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-60">
          {saving ? "Création..." : "Créer la leçon"}
        </button>
      </form>

      {/* Lesson list */}
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground text-sm">Leçons existantes ({lessons.length})</h3>
        {lessons.sort((a, b) => (a.order || 0) - (b.order || 0)).map(l => {
          const module = l.module || {};
          const theme = module.theme || l.title;
          const niveau = normalizeLessonLevel(module.niveau || l.level);
          const description = module.description || l.description || l.content || "Aucune description";
          const exercises = Array.isArray(module.exercices) ? module.exercices : [];
          const expanded = expandedLessonId === l.id;
          return (
            <div key={l.id} className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center gap-3 p-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{l.order}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-sm">{theme} {l.title_fr && <span className="text-muted-foreground">· {l.title_fr}</span>}</div>
                  <div className="text-xs text-muted-foreground">{niveau} · {l.type}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</div>
                </div>
                <button onClick={() => setExpandedLessonId(expanded ? null : l.id)} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition">
                  {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <button onClick={() => togglePublish(l)} className={`p-2 rounded-lg transition ${l.published ? "text-green-500 hover:bg-green-500/10" : "text-muted-foreground hover:bg-secondary"}`}>
                  {l.published ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {expanded && (
                <div className="border-t border-border bg-background/80 p-4 text-sm text-muted-foreground space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="font-semibold text-foreground">Thème</span><br />{theme}</div>
                    <div><span className="font-semibold text-foreground">Niveau</span><br />{niveau || "Non défini"}</div>
                  </div>
                  {editingLessonId === l.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Thème</label>
                          <input
                            value={editLessonDraft.theme}
                            onChange={(e) => handleEditLessonChange("theme", e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Titre français</label>
                          <input
                            value={editLessonDraft.title_fr}
                            onChange={(e) => handleEditLessonChange("title_fr", e.target.value)}
                            className={inputCls}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className={labelCls}>Niveau</label>
                          <select
                            value={editLessonDraft.niveau}
                            onChange={(e) => handleEditLessonChange("niveau", e.target.value)}
                            className={inputCls}
                          >
                            <option value="Débutant">Débutant</option>
                            <option value="Intermédiaire">Intermédiaire</option>
                            <option value="Avancé">Avancé</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Type</label>
                          <select
                            value={editLessonDraft.type}
                            onChange={(e) => handleEditLessonChange("type", e.target.value)}
                            className={inputCls}
                          >
                            <option value="vocabulary">Vocabulaire</option>
                            <option value="phrases">Phrases</option>
                            <option value="letters">Lettres</option>
                            <option value="sounds">Sons</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Ordre</label>
                          <input
                            type="number"
                            min="1"
                            value={editLessonDraft.order}
                            onChange={(e) => handleEditLessonChange("order", parseInt(e.target.value || 1, 10))}
                            className={inputCls}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Description</label>
                        <textarea
                          rows={3}
                          value={editLessonDraft.description}
                          onChange={(e) => handleEditLessonChange("description", e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => saveLessonModule(l)}
                          disabled={saving}
                          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                        >
                          {saving ? "Enregistrement..." : "Enregistrer le module"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditLesson}
                          className="rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground hover:bg-secondary"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div><span className="font-semibold text-foreground">Thème</span><br />{theme}</div>
                        <div><span className="font-semibold text-foreground">Niveau</span><br />{niveau || "Non défini"}</div>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">Description</span>
                        <p className="mt-1 text-sm text-muted-foreground leading-5">{description}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">Exercices</span>
                        <p className="mt-1 text-sm text-muted-foreground">{exercises.length} élément(s) · {exercises.map((ex) => ex.type).filter(Boolean).join(" • ") || "Aucun exercice"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startEditLesson(l)}
                        className="rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground hover:bg-secondary"
                      >
                        Modifier le module
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {lessons.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Aucune leçon</p>}
      </div>
    </div>
  );
}