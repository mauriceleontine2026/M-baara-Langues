// @ts-nocheck
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { invokeAI } from "@/api/aiService";
import { createVocabulary } from "@/api/languageService";
import { Scan, ArrowLeft, Upload, Loader2, Plus, CheckCircle, Languages } from "lucide-react";

/**
 * @typedef {{ word: string; translation: string }} OCRWord
 * @typedef {{ original_text: string; translated_text: string; source_language: string; words: OCRWord[] }} OCRResult
 */

export default function ScanOCR() {
  const [imageFile, setImageFile] = useState(/** @type {File | null} */ (null));
  const [imagePreview, setImagePreview] = useState(/** @type {string | null} */ (null));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(/** @type {OCRResult | null} */ (null));
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  /** @param {Event} e */
  const handleFile = (e) => {
    const target = /** @type {HTMLInputElement} */ (e.target);
    const file = target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResult(null);
    setAdded(false);
    setError("");
  };

  const scanAndTranslate = async () => {
    if (!imageFile) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      // Upload the image
      const res = await invokeAI(
        "Tu es un assistant OCR de Mǎa-kwɛ́lî. Analyse cette image. Extrais tout le texte visible. Identifie la langue du texte. Traduis le texte en français. Si le texte contient plusieurs mots, sépare-les. Retourne le résultat en JSON.",
        {
          type: "object",
          properties: {
            original_text: { type: "string", description: "Texte extrait de l'image" },
            translated_text: { type: "string", description: "Traduction française" },
            source_language: { type: "string", description: "Langue détectée" },
            words: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  word: { type: "string" },
                  translation: { type: "string" }
                }
              }
            }
          }
        }
      );
      setResult(typeof res === "object" && res !== null ? res : { original_text: String(res ?? ""), translated_text: "", source_language: "", words: [] });
    } catch (err) {
      setError("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToReview = async () => {
    if (!result) return;
    const r = /** @type {any} */ (result);
    const words = Array.isArray(r.words) ? /** @type {any[]} */ (r.words) : [];
    if (words.length === 0) return;
    setAdding(true);
    try {
      const items = words.map(/** @param {any} w */ (w) => ({
        language_code: (r.source_language && String(r.source_language).toLowerCase().split(" ")[0]) || "unknown",
        lesson_number: 1,
        word: w?.word,
        translation_fr: w?.translation,
        difficulty: "beginner",
      })).filter((w) => w.word && w.translation_fr);

      if (items.length > 0) {
        await Promise.all(items.map((item) => createVocabulary(item)));
      }
      setAdded(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError("Erreur : " + errorMessage);
    } finally {
      setAdding(false);
    }
  };

  const reset = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setAdded(false);
    setError("");
    if (fileInputRef.current) {
      try { fileInputRef.current.value = ""; } catch (e) { /* ignore readonly in some env */ }
    }
  };

  // Provide a safe any-cast for template usage to avoid TS 'never' index errors
  const resultAny = /** @type {any} */ (result);

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto">
      <Link to="/studio" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft size={16} /> Studio
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
          <Scan className="text-green-500" size={24} />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Scan &amp; Traduit</h1>
          <p className="text-sm text-muted-foreground">OCR intelligent + traduction + file SRS</p>
        </div>
      </div>

      {/* Upload area */}
      {!imagePreview ? (
        <button onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-primary/40 hover:bg-primary/5 transition">
          <Upload className="mx-auto text-muted-foreground mb-3" size={40} />
          <p className="font-semibold text-foreground">Photographier ou importer une image</p>
          <p className="text-sm text-muted-foreground mt-1">Panneau, menu, livre... l'IA extrait et traduit le texte</p>
        </button>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-4 mb-5">
          <img src={imagePreview} alt="Aperçu" className="w-full rounded-xl max-h-64 object-contain mb-3" />
          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/70 transition">
              Changer
            </button>
            <button onClick={scanAndTranslate} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-60">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Analyse...</> : <><Scan size={16} /> Scanner &amp; Traduire</>}
            </button>
          </div>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />

      {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Languages size={18} className="text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Langue détectée</span>
                </div>
                <p className="text-foreground font-medium">{resultAny?.source_language || "Non identifiée"}</p>
              </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Texte original</h3>
            <p className="text-foreground whitespace-pre-wrap">{resultAny?.original_text}</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Traduction française</h3>
            <p className="text-foreground whitespace-pre-wrap">{resultAny?.translated_text}</p>
          </div>

          {(resultAny?.words && resultAny.words.length > 0) && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Mots extraits ({resultAny?.words?.length || 0})</h3>
              <div className="space-y-2 mb-4">
                {resultAny.words.map((/** @type {any} */ w, /** @type {number} */ i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{w.word}</span>
                    <span className="text-muted-foreground">{w.translation}</span>
                  </div>
                ))}
              </div>
              {added ? (
                <div className="flex items-center justify-center gap-2 text-green-500 text-sm font-medium py-2">
                  <CheckCircle size={18} /> Ajouté à ta file de révision !
                </div>
              ) : (
                <button onClick={addToReview} disabled={adding}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-60">
                  {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {adding ? "Ajout..." : "Ajouter à ma file de révision"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

  // EOF