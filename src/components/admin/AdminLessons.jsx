import { useEffect, useState } from "react";
import { createLesson, getLessonsForLanguage, updateLesson } from "@/api/languageService";
import { Plus, Eye, EyeOff } from "lucide-react";

export default function AdminLessons({ languages }) {
  const [lessons, setLessons] = useState([]);
  const [lang, setLang] = useState("");
  const [newLesson, setNewLesson] = useState({ title: "", title_fr: "", level: "A1", order: 1, type: "vocabulary", description: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

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
    } catch (err) { setMsg("❌ " + err.message); }
    finally { setSaving(false); }
  };

  const togglePublish = async (l) => {
    await updateLesson(l.id, { published: !l.published });
    getLessonsForLanguage(lang).then(setLessons).catch(() => setLessons([]));
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
              <option value="A1">A1</option><option value="A2">A2</option><option value="B1">B1</option><option value="B2">B2</option>
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
        {lessons.sort((a, b) => (a.order || 0) - (b.order || 0)).map(l => (
          <div key={l.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{l.order}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground text-sm">{l.title} {l.title_fr && <span className="text-muted-foreground">· {l.title_fr}</span>}</div>
              <div className="text-xs text-muted-foreground">{l.level} · {l.type}</div>
            </div>
            <button onClick={() => togglePublish(l)} className={`p-2 rounded-lg transition ${l.is_published ? "text-green-500 hover:bg-green-500/10" : "text-muted-foreground hover:bg-secondary"}`}>
              {l.is_published ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        ))}
        {lessons.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Aucune leçon</p>}
      </div>
    </div>
  );
}