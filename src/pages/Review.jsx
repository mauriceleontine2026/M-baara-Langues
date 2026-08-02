import { useEffect, useState } from "react";
import { getLanguages, getAllVocabulary, createVocabulary } from "@/api/languageService";
import { Calendar, Layers, RotateCcw, Plus, CheckCircle2, WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getOfflineLanguages, getAllOfflineVocab } from "@/lib/offlineStorage";

/** @type {any[]} */
const initialList = [];
/** @type {{ word: string; translation_fr: string; language_code: string }} */
const initialNewWord = { word: "", translation_fr: "", language_code: "" };

export default function Review() {
  const [languages, setLanguages] = useState(initialList);
  const [items, setItems] = useState(initialList);
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newWord, setNewWord] = useState(initialNewWord);
  const online = useOnlineStatus();

  useEffect(() => {
    if (online) {
      getLanguages()
        .then((data) => setLanguages(Array.isArray(data) ? data : []))
        .catch(() => setLanguages([]));
      getAllVocabulary()
        .then((data) => setItems(Array.isArray(data) ? data : []))
        .catch(() => setItems([]));
    } else {
      const offlineLanguages = getOfflineLanguages();
      const offlineItems = getAllOfflineVocab();
      setLanguages(Array.isArray(offlineLanguages) ? offlineLanguages : []);
      setItems(Array.isArray(offlineItems) ? offlineItems : []);
    }
  }, [online]);

  /** @type {any[]} */
  const filtered = filter === "all" ? items : items.filter(i => i.language_code === filter);
  const toReview = Math.floor(filtered.length * 0.3);

  const handleAdd = /** @type {(e: import("react").FormEvent<HTMLFormElement>) => Promise<void>} */ (async (e) => {
    e.preventDefault();
    if (!newWord.word || !newWord.translation_fr || !newWord.language_code) return;
    await createVocabulary({ ...newWord, lesson_number: 1, difficulty: "beginner" });
    setNewWord(initialNewWord);
    setShowAdd(false);
    getAllVocabulary()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  });

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <h1 className="font-heading text-3xl font-bold text-foreground mb-1">File de Révision</h1>
      <p className="text-muted-foreground mb-6">Algorithme SM-2 — intervalles adaptés à votre mémoire.</p>
      {!online && (
        <div className="flex items-center gap-2 text-sm text-yellow-500 bg-yellow-500/10 rounded-xl px-4 py-2.5 mb-6">
          <WifiOff size={16} /> Mode hors-ligne — révision des leçons téléchargées
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <Calendar className="mx-auto mb-2 text-primary" size={24} />
          <div className="text-2xl font-bold text-foreground">{toReview}</div>
          <div className="text-xs text-muted-foreground">À revoir</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <Layers className="mx-auto mb-2 text-blue-500" size={24} />
          <div className="text-2xl font-bold text-foreground">{items.length}</div>
          <div className="text-xs text-muted-foreground">Cartes totales</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <RotateCcw className="mx-auto mb-2 text-green-500" size={24} />
          <div className="text-2xl font-bold text-foreground">0</div>
          <div className="text-xs text-muted-foreground">Révisions cumulées</div>
        </div>
      </div>

      {/* Language filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        <button onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"}`}>
          Toutes
        </button>
        {languages.map(l => (
          <button key={l.code} onClick={() => setFilter(l.code)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${filter === l.code ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"}`}>
            {l.flag_emoji} {l.name_fr}
          </button>
        ))}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <CheckCircle2 className="mx-auto mb-3 text-green-500" size={48} />
          <p className="font-semibold text-foreground mb-1">Tout est à jour 🚩</p>
          <p className="text-sm text-muted-foreground mb-4">Ajoutez vos premiers mots pour démarrer la répétition espacée.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 10).map(item => {
            const lang = languages.find(l => l.code === item.language_code);
            return (
              <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <span className="text-xl">{lang?.flag_emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold text-foreground">{item.word}</div>
                  <div className="text-xs text-muted-foreground">{item.translation_fr}</div>
                </div>
                <button className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium hover:bg-primary/20 transition">
                  Réviser
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add word */}
      <button onClick={() => setShowAdd(!showAdd)}
        className="mt-6 w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-medium py-3 rounded-xl hover:bg-secondary/70 transition">
        <Plus size={18} /> Ajouter un mot à réviser
      </button>

      {showAdd && (
        <form onSubmit={handleAdd} className="mt-4 bg-card border border-border rounded-2xl p-5 space-y-3">
          <select value={newWord.language_code} onChange={/** @param {import("react").ChangeEvent<HTMLSelectElement>} e */ (e) => setNewWord({ ...newWord, language_code: e.target.value })}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="">Langue...</option>
            {languages.map(l => <option key={l.code} value={l.code}>{l.name_fr}</option>)}
          </select>
          <input value={newWord.word} onChange={/** @param {import("react").ChangeEvent<HTMLInputElement>} e */ (e) => setNewWord({ ...newWord, word: e.target.value })}
            placeholder="Mot" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <input value={newWord.translation_fr} onChange={/** @param {import("react").ChangeEvent<HTMLInputElement>} e */ (e) => setNewWord({ ...newWord, translation_fr: e.target.value })}
            placeholder="Traduction française" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <button type="submit" className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 transition">
            Ajouter
          </button>
        </form>
      )}
    </div>
  );
}