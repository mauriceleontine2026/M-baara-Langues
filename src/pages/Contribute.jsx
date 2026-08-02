// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { uploadFile } from "@/api/uploadService";
import { getLanguages } from "@/api/languageService";
import { Mic, Upload, Square, Trash2, ShieldCheck } from "lucide-react";
import { moderateContent, getModerationMessage } from "@/lib/moderation";
import AudioVisualizer from "@/components/contribute/AudioVisualizer";

export default function Contribute() {
  const [languages, setLanguages] = useState(/** @type {any[]} */ ([]));
  const [form, setForm] = useState({
    language_code: "", word: "", phonetic: "", translation_fr: "",
    contributor_name: "", region: "", context_notes: ""
  });
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(/** @type {Blob | null} */ (null));
  const [audioUrl, setAudioUrl] = useState(/** @type {string | null} */ (null));
  const [recordTime, setRecordTime] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [stream, setStream] = useState(/** @type {MediaStream | null} */ (null));
  const [mimeType, setMimeType] = useState("");
  const mediaRecorderRef = useRef(/** @type {MediaRecorder | null} */ (null));
  const chunksRef = useRef(/** @type {Blob[]} */ ([]));
  const streamRef = useRef(/** @type {MediaStream | null} */ (null));
  const timerRef = useRef(/** @type {ReturnType<typeof setInterval> | null} */ (null));

  useEffect(() => {
    getLanguages()
      .then((data) => setLanguages(Array.isArray(data) ? data : []))
      .catch(() => setLanguages([]));
      return () => {
        const s = /** @type {any} */ (streamRef.current);
        if (s && typeof s.getTracks === 'function') s.getTracks().forEach((/** @type {any} */ t) => t.stop());
        if (timerRef.current) clearInterval(/** @type {any} */ (timerRef.current));
      };
  }, []);

  const getSupportedMimeType = () => {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/ogg;codecs=opus", "audio/ogg"];
    for (const t of types) { try { if (MediaRecorder.isTypeSupported(t)) return t; } catch {} }
    return "";
  };

  const startRecording = async () => {
    setMsg("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMsg("❌ Ton navigateur ne supporte pas l'enregistrement. Utilise Chrome, Edge ou Safari récent.");
      return;
    }
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
      streamRef.current = newStream;
      setStream(newStream);
      const mType = getSupportedMimeType();
      setMimeType(mType);
      const recorder = mType ? new MediaRecorder(newStream, { mimeType: mType }) : new MediaRecorder(newStream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mType || "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        newStream.getTracks().forEach((t) => t.stop());
        setStream(null);
      };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordTime(0);
      timerRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setMsg("❌ Microphone inaccessible : " + (errorMessage || "autorise l'accès au micro dans ton navigateur."));
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordTime(0);
    setStream(null);
  };

  /** @param {Event} e */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.word || !form.translation_fr || !form.language_code) {
      setMsg("❌ Veuillez remplir tous les champs obligatoires.");
      return;
    }

    // Content moderation
    const fullText = `${form.word} ${form.translation_fr} ${form.context_notes} ${form.contributor_name}`;
    const mod = moderateContent(fullText);
    if (!mod.ok) {
      setMsg(getModerationMessage(mod.reason));
      return;
    }

    setSaving(true);
    setMsg("");
    try {
      // Upload audio if recorded
      let audio_url = "";
      if (audioBlob) {
        const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
        const file = new File([audioBlob], `contribution_${Date.now()}.${ext}`, { type: mimeType || "audio/webm" });
        const uploadRes = await uploadFile(file);
        audio_url = uploadRes?.file_url || "";
      }
      setMsg("✅ Contribution soumise ! Après validation, elle enrichira l'app pour tous les apprenants.");
      setForm({ ...form, word: "", phonetic: "", translation_fr: "", context_notes: "" });
      deleteRecording();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setMsg("❌ Erreur lors de l'envoi : " + errorMessage);
    }
  };

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto">
      <h1 className="font-heading text-3xl font-bold text-foreground mb-1">Studio Contribution</h1>

      {/* Callout */}
      <div className="flex items-center gap-3 mb-6">
        <div className="shrink-0 w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <Mic className="text-yellow-500" size={20} />
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Tu es un locuteur natif ?</p>
          <p className="text-sm text-muted-foreground">Enregistre ta voix, ajoute des mots et phonétiques pour ta langue. Après validation, ta contribution enrichit l'application pour tous les apprenants.</p>
        </div>
      </div>
      {/* Language selector */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Langue concernée</label>
        <select value={form.language_code} onChange={e => setForm({ ...form, language_code: e.target.value })}
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
          <option value="">Sélectionner une langue...</option>
          {languages.map(l => <option key={l.code} value={l.code}>{l.name_fr}</option>)}
        </select>
      </div>

      {/* Recording studio */}
      <div className="bg-card border border-border rounded-2xl p-8 mb-6 text-center">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Studio d'enregistrement</p>

        {!audioUrl ? (
          <>
            <button onClick={recording ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition shadow-lg ${
                recording ? "bg-red-500 animate-pulse shadow-red-500/30" : "bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/20"
              }`}>
              {recording ? <Square size={28} className="text-white" /> : <Mic size={32} className="text-white" />}
            </button>
            {recording && stream && (
              <div className="mt-4">
                <AudioVisualizer stream={stream} />
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              {recording ? `Enregistrement... ${fmtTime(recordTime)}` : "Clique pour enregistrer"}
            </p>
            {recording && (
              <p className="text-xs text-red-500 mt-1">Clique sur le carré pour arrêter</p>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-500">
              <ShieldCheck size={20} />
              <span className="text-sm font-medium">Enregistrement prêt ({fmtTime(recordTime)})</span>
            </div>
            <audio controls src={audioUrl} className="w-full max-w-sm mx-auto" />
            <div className="flex items-center justify-center gap-3">
              <button onClick={startRecording}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600 transition">
                <Mic size={16} /> Réenregistrer
              </button>
              <button onClick={deleteRecording}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/70 transition">
                <Trash2 size={16} /> Supprimer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Informations du contenu</h3>
          <div className="space-y-3">
            <input value={form.word} onChange={e => setForm({ ...form, word: e.target.value })}
              placeholder="Mot ou expression (Ex: Teranga, Asante...)"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <input value={form.phonetic} onChange={e => setForm({ ...form, phonetic: e.target.value })}
              placeholder="Phonétique (IPA ou simple) (Ex: te-ran-ga, /tεrãga/)"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <input value={form.translation_fr} onChange={e => setForm({ ...form, translation_fr: e.target.value })}
              placeholder="Traduction française * (Ex: hospitalité, merci...)"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ton profil de locuteur</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.contributor_name} onChange={e => setForm({ ...form, contributor_name: e.target.value })}
              placeholder="Ton prénom (Mamadou, Fatou...)"
              className="bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <input value={form.region} onChange={e => setForm({ ...form, region: e.target.value })}
              placeholder="Ta région / ville (Conakry, Dakar...)"
              className="bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Notes / Contexte (optionnel)</h3>
          <textarea value={form.context_notes} onChange={e => setForm({ ...form, context_notes: e.target.value })}
            placeholder="Contexte d'utilisation, dialecte spécifique..."
            rows={3}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
        </div>

        {msg && (
          <p className={`text-sm text-center ${msg.startsWith("✅") ? "text-green-500" : msg.startsWith("⚠️") ? "text-yellow-500" : "text-red-500"}`}>
            {msg}
          </p>
        )}

        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:opacity-90 transition disabled:opacity-60">
          <Upload size={18} /> {saving ? "Envoi..." : "Soumettre ma contribution"}
        </button>
      </form>
    </div>
  );
}

// EOF