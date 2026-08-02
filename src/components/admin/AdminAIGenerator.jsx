import { useState } from "react";
import { invokeAI } from "@/api/aiService";
import { createLesson, createVocabulary } from "@/api/languageService";
import { Sparkles, Loader2, Upload, Wand, Check, BookOpen, List } from "lucide-react";

const PRESETS = [
  "20 salutations et expressions de politesse",
  "Les nombres de 1 à 20",
  "Animaux domestiques et sauvages",
  "Couleurs",
  "Nourriture et boissons courantes",
  "Membres de la famille",
  "Verbes d'action courants",
  "Phrases utiles pour voyager",
  "Le corps humain",
  "Vêtements et accessoires",
  "La maison et le mobilier",
  "Jours de la semaine et mois",
];

export default function AdminAIGenerator({ languages }) {
  const [mode, setMode] = useState("vocabulary");
  const [lang, setLang] = useState("");
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(15);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState([]);
  const [lessonData, setLessonData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState("");

  const updateItem = (i, field, value) => {
    setGenerated(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const toggleItem = (i) => {
    setGenerated(prev => prev.map((item, idx) => idx === i ? { ...item, _selected: !item._selected } : item));
  };

  const generate = async () => {
    if (!lang || !prompt) return;
    setGenerating(true);
    setMsg("");
    setGenerated([]);
    setLessonData(null);
    try {
      const langObj = languages.find(l => l.code === lang);
      const fullPrompt = `Tu es un générateur de contenu pédagogique pour M'baara, une application d'apprentissage de langues africaines et internationales.

Génère du contenu pour la langue: ${langObj?.name_fr} (${langObj?.name}), code: ${lang}.

Demande de l'administrateur: ${prompt}
Nombre de mots souhaité: ${count}

${mode === "lesson" ? "Génère d'abord une leçon (titre, titre français, description, niveau A1-A2-B1-B2, type, ordre), puis son vocabulaire." : "Génère une liste de mots de vocabulaire."}

Pour CHAQUE mot, fournis obligatoirement:
- word: le mot dans la langue cible
- translation_fr: la traduction française
- phonetic: la phonétique en IPA (ex: /dja-ra-ma/)
- phonetic_simple: une prononciation simple lisible (ex: dja-ra-ma)
- example_target: un exemple d'utilisation dans la langue cible
- example_fr: la traduction de l'exemple en français
- category: la catégorie (ex: salutations, nombres, animaux...)

Sois précis et culturellement correct. Si tu ne connais pas un mot, ne l'invente pas.`;

      const schema = {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                word: { type: "string" },
                translation_fr: { type: "string" },
                phonetic: { type: "string" },
                phonetic_simple: { type: "string" },
                example_target: { type: "string" },
                example_fr: { type: "string" },
                category: { type: "string" },
              },
            },
          },
        },
      };

      if (mode === "lesson") {
        schema.properties.lesson = {
          type: "object",
          properties: {
            title: { type: "string" },
            title_fr: { type: "string" },
            description: { type: "string" },
            level: { type: "string" },
            type: { type: "string" },
            order: { type: "number" },
          },
        };
      }

      const res = await invokeAI(fullPrompt, schema);

      const safeRes = /** @type {{ items?: any[]; lesson?: any }} */ (res ?? {});
      const items = Array.isArray(safeRes.items) ? safeRes.items.map(item => ({ ...item, _selected: true })) : [];
      setGenerated(items);
      if (mode === "lesson" && safeRes.lesson && typeof safeRes.lesson === 'object') setLessonData(safeRes.lesson);
    } catch (err) {
      setMsg("❌ " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const importItems = async () => {
    const selected = generated.filter(item => item._selected && item.word);
    if (selected.length === 0) return;
    setImporting(true);
    setMsg("");
    try {
      let lessonNum = 1;
      if (mode === "lesson" && lessonData) {
        const lesson = await createLesson({
          language_code: lang,
          title: lessonData.title,
          title_fr: lessonData.title_fr || "",
          description: lessonData.description || "",
          level: lessonData.level || "A1",
          type: lessonData.type || "vocabulary",
          order: lessonData.order || 1,
          lesson_number: lessonData.order || 1,
          published: true,
        });
        lessonNum = lessonData.order || 1;
      }

      const items = selected.map(item => ({
        language_code: lang,
        lesson_number: lessonNum,
        word: item.word,
        translation_fr: item.translation_fr,
        phonetic: item.phonetic || "",
        example_target: item.example_target || "",
        example_fr: item.example_fr || "",
        difficulty: "beginner",
      }));

      await Promise.all(items.map((item) => createVocabulary(item)));
      setMsg(`✅ ${items.length} mot(s) importé(s)${mode === "lesson" ? " + leçon créée" : ""} !`);
      setGenerated([]);
      setLessonData(null);
      setPrompt("");
    } catch (err) {
      setMsg("❌ " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const inputCls = "w-full border border-border bg-background rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40";

  return (
    <div className="space-y-5">
      {/* Mode selector */}
      <div className="flex gap-2">
        <button onClick={() => setMode("vocabulary")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${mode === "vocabulary" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
          <List size={16} /> Vocabulaire
        </button>
        <button onClick={() => setMode("lesson")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${mode === "lesson" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
          <BookOpen size={16} /> Leçon complète
        </button>
      </div>

      {/* Config */}
      <div className="bg-card rounded-2xl p-5 border border-border space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Langue *</label>
            <select value={lang} onChange={e => setLang(e.target.value)} className="w-full border border-border bg-background rounded-xl px-3 py-2.5 text-sm">
              <option value="">Choisir...</option>
              {languages.map(l => <option key={l.code} value={l.code}>{l.flag_emoji} {l.name_fr}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nombre de mots</label>
            <input type="number" min="1" max="50" value={count} onChange={e => setCount(parseInt(e.target.value) || 10)} className="w-full border border-border bg-background rounded-xl px-3 py-2.5 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Décris ce que tu veux générer *</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={2}
            placeholder="Ex: 15 mots sur les transports en commun avec exemples pratiques"
            className="w-full border border-border bg-background rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
        </div>

        {/* Presets */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Suggestions rapides</label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button key={p} onClick={() => setPrompt(p)}
                className="px-3 py-1.5 rounded-full text-xs bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary transition">
                {p}
              </button>
            ))}
          </div>
        </div>

        <button onClick={generate} disabled={generating || !lang || !prompt}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-60 transition">
          {generating ? <><Loader2 size={18} className="animate-spin" /> Génération en cours...</> : <><Wand size={18} /> Générer avec l'IA</>}
        </button>
      </div>

      {msg && <p className="text-sm text-center">{msg}</p>}

      {/* Lesson data (if lesson mode) */}
      {lessonData && (
        <div className="bg-primary/5 border border-primary/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary"><BookOpen size={16} /> Leçon générée</div>
          <div className="grid grid-cols-2 gap-2">
            <input value={lessonData.title || ""} onChange={e => setLessonData({ ...lessonData, title: e.target.value })} className={inputCls} placeholder="Titre" />
            <input value={lessonData.title_fr || ""} onChange={e => setLessonData({ ...lessonData, title_fr: e.target.value })} className={inputCls} placeholder="Titre FR" />
          </div>
          <input value={lessonData.description || ""} onChange={e => setLessonData({ ...lessonData, description: e.target.value })} className={inputCls} placeholder="Description" />
          <div className="grid grid-cols-3 gap-2">
            <select value={lessonData.level || "A1"} onChange={e => setLessonData({ ...lessonData, level: e.target.value })} className={inputCls}>
              <option value="A1">A1</option><option value="A2">A2</option><option value="B1">B1</option><option value="B2">B2</option>
            </select>
            <select value={lessonData.type || "vocabulary"} onChange={e => setLessonData({ ...lessonData, type: e.target.value })} className={inputCls}>
              <option value="vocabulary">Vocabulaire</option><option value="phrases">Phrases</option><option value="letters">Lettres</option><option value="sounds">Sons</option>
            </select>
            <input type="number" value={lessonData.order || 1} onChange={e => setLessonData({ ...lessonData, order: parseInt(e.target.value) })} className={inputCls} placeholder="Ordre" />
          </div>
        </div>
      )}

      {/* Generated items */}
      {generated.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Sparkles size={16} className="text-primary" /> {generated.filter(i => i._selected).length} / {generated.length} mots sélectionnés
            </h3>
            <div className="flex gap-2">
              <button onClick={() => setGenerated(prev => prev.map(i => ({ ...i, _selected: true })))} className="text-xs text-primary hover:underline">Tout sélectionner</button>
              <button onClick={() => setGenerated(prev => prev.map(i => ({ ...i, _selected: false })))} className="text-xs text-muted-foreground hover:underline">Tout désélectionner</button>
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {generated.map((item, i) => (
              <div key={i} className={`bg-card rounded-xl p-3 border ${item._selected ? "border-border" : "border-border opacity-50"}`}>
                <div className="flex items-start gap-2">
                  <button onClick={() => toggleItem(i)}
                    className={`mt-1 w-5 h-5 rounded flex items-center justify-center shrink-0 transition ${item._selected ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                    {item._selected && <Check size={14} />}
                  </button>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input value={item.word || ""} onChange={e => updateItem(i, "word", e.target.value)} className={inputCls} placeholder="Mot" />
                    <input value={item.translation_fr || ""} onChange={e => updateItem(i, "translation_fr", e.target.value)} className={inputCls} placeholder="Traduction FR" />
                    <input value={item.phonetic || ""} onChange={e => updateItem(i, "phonetic", e.target.value)} className={inputCls} placeholder="Phonétique IPA" />
                    <input value={item.phonetic_simple || ""} onChange={e => updateItem(i, "phonetic_simple", e.target.value)} className={inputCls} placeholder="Phonétique simple" />
                    <input value={item.example_target || ""} onChange={e => updateItem(i, "example_target", e.target.value)} className={inputCls} placeholder="Exemple (cible)" />
                    <input value={item.example_fr || ""} onChange={e => updateItem(i, "example_fr", e.target.value)} className={inputCls} placeholder="Traduction exemple" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={importItems} disabled={importing}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-60 transition">
            {importing ? <><Loader2 size={18} className="animate-spin" /> Import...</> : <><Upload size={18} /> Importer {generated.filter(i => i._selected).length} mot(s)</>}
          </button>
        </div>
      )}
    </div>
  );
}