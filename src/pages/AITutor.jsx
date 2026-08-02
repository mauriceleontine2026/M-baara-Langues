import { useEffect, useRef, useState } from "react";
import { invokeAI } from "@/api/aiService";
import { getLanguages, getVocabularyForLanguage } from "@/api/languageService";
import { Send, Mic, Volume2, Square, Headphones, Languages } from "lucide-react";
import { moderateContent, getModerationMessage } from "@/lib/moderation";
import { buildPhonologyContext, getTTSLocale, getBestVoice, getPhonologyProfile } from "@/lib/languagePhonology";
// public logo at /logo.png

const SUGGESTIONS = [
  "Apprends-moi l'alphabet Soussou",
  "Comment dire bonjour en Wolof ?",
  "Explique les tons du Yoruba",
  "Comment prononcer les implosives ɓ et ɗ ?",
  "Quels sons sont difficiles en Malinké ?",
  "Corrige ma prononciation des voyelles ɛ et ɔ",
];

export default function AITutor() {
  /** @type {{ role: string; content: string }[]} */
  const initialMessages = [];
  /** @type {any[]} */
  const initialAnyArray = [];

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState(initialAnyArray);
  const [lang, setLang] = useState("");
  const [vocab, setVocab] = useState(initialAnyArray);
  const [listening, setListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [siriMode, setSiriMode] = useState(false);
  const recognitionRef = /** @type {import("react").MutableRefObject<any>} */ (useRef(null));
  const scrollRef = /** @type {import("react").MutableRefObject<HTMLDivElement | null>} */ (useRef(null));
  const siriModeRef = useRef(/** @type {boolean} */ (false));
  const voiceModeRef = useRef(/** @type {boolean} */ (false));

  useEffect(() => { siriModeRef.current = siriMode; }, [siriMode]);
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);

  // Fetch all languages from database
  useEffect(() => {
    getLanguages()
      .then((langs) => {
        const safeLangs = Array.isArray(langs) ? langs : [];
        setLanguages(safeLangs);
        if (safeLangs.length > 0 && !lang) setLang(safeLangs[0].code);
      })
      .catch(() => setLanguages([]));
  }, []);

  // Fetch vocabulary for selected language (dictionary data)
  useEffect(() => {
    if (lang) {
      getVocabularyForLanguage(lang)
        .then((data) => setVocab(Array.isArray(data) ? data : []))
        .catch(() => setVocab([]));
    } else {
      setVocab([]);
    }
  }, [lang]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  /**
   * @param {string} text
   * @param {() => void} [onEnd]
   */
  const speak = (text, onEnd) => {
    if (!("speechSynthesis" in window)) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const locale = getTTSLocale(lang);
    const voice = getBestVoice(lang);
    if (voice) u.voice = voice;
    u.lang = locale;
    u.rate = 0.88; // Légèrement ralenti pour l'apprentissage
    u.onend = () => onEnd?.();
    window.speechSynthesis.speak(u);
  };

  /**
   * @param {(transcript: string) => void} onResult
   */
  const startListening = (onResult) => {
    const win = /** @type {any} */ (window);
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) {
      alert("Reconnaissance vocale non supportée. Utilisez Chrome ou Edge.");
      return;
    }
    const rec = /** @type {any} */ (new SR());
    rec.lang = getTTSLocale(lang);
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = /** @param {any} e */ (e) => onResult(e.results[0][0].transcript);
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  // Build dictionary context from vocabulary items
  /** @param {string} langLabel */
  const buildDictContext = (langLabel) => {
    if (vocab.length === 0) return "";
    const vocabList = vocab.slice(0, 60).map(v => {
      let entry = `• ${v.word}`;
      if (v.translation_fr) entry += ` = ${v.translation_fr}`;
      if (v.phonetic) entry += ` [phonétique IPA: ${v.phonetic}]`;
      if (v.phonetic_simple) entry += ` (prononciation simple: ${v.phonetic_simple})`;
      if (v.example_target) entry += ` | Exemple: ${v.example_target}`;
      if (v.example_fr) entry += ` — ${v.example_fr}`;
      if (v.audio_url) entry += ` [AUDIO:${v.audio_url}]`;
      return entry;
    }).join("\n");
    return `\n\nDICTIONNAIRE DE RÉFÉRENCE (${langLabel}):\n${vocabList}\n\nIMPORTANT: Utilise UNIQUEMENT les phonétiques ci-dessus pour la prononciation. Si l'apprenant demande un mot du dictionnaire, donne sa phonétique exacte. Si un audio est disponible (marqué [AUDIO:url]), inclus le marqueur [AUDIO:url] dans ta réponse pour que l'apprenant puisse l'écouter. Si le mot demandé n'est pas dans le dictionnaire, dis-le et donne ton mieux.`;
  };
  /** @param {string} msg */  const callLLM = async (msg) => {
    const langObj = languages.find(l => l.code === lang);
    const langLabel = langObj ? `${langObj.name_fr} (${langObj.name})` : lang;
    const dictContext = buildDictContext(langLabel);
    const phonologyContext = buildPhonologyContext(lang, langObj);

    const prompt = `Tu es Kôrô, l'assistant IA de M'baara, une plateforme d'apprentissage des langues africaines et internationales. Tu es à la fois un tuteur pédagogique, un expert en phonétique et un coach de prononciation adaptatif.

L'apprenant a choisi la langue: ${langLabel}.

RÈGLES:
1. Réponds en français de manière naturelle, conversationnelle et encourageante.
2. Pour la prononciation, utilise TOUJOURS les phonétiques du dictionnaire de référence fourni ci-dessous. Ne invente JAMAIS de phonétiques.
3. ADAPTE-TOI À L'ACCENT ET À LA PRONONCIATION de la langue choisie en suivant le profil phonologique fourni ci-dessous.
4. Pour chaque mot ou expression dans la langue cible:
   - Donne la phonétique IPA ET une prononciation simplifiée en français
   - Explique comment articuler les sons spécifiques (implosives, tons, nasales, emphatiques, etc.)
   - Compare avec les sons français les plus proches
   - Si la langue est tonale, indique le ton de chaque mot et explique comment le réaliser
5. Corrige activement les erreurs de prononciation fréquentes listées dans le profil phonologique.
6. Si un mot demandé est dans le dictionnaire, donne sa phonétique exacte et mentionne si un audio est disponible.
7. Tu peux converser sur la culture, les traditions, l'histoire, le voyage — pas seulement l'apprentissage strict.
8. Reste respectueux, professionnel et bienveillant. Refuse tout contenu inapproprié, insultes, ou hors-sujet non-pédagogique.
9. Sois concis mais complet. Donne des exemples concrets dans la langue cible.${dictContext}${phonologyContext}

Question de l'apprenant: ${msg}`;

    const res = await invokeAI(prompt);
    if (res && typeof res === "object" && "content" in res) {
      return /** @type {string} */ (res.content);
    }
    return typeof res === "string" ? res : JSON.stringify(res ?? "");
  };

  // Extract audio URLs from AI response
  /** @param {unknown} content */
  const extractAudioUrls = (content) => {
    const text = typeof content === "string" ? content : String(content ?? "");
    const urls = [];
    const regex = /\[AUDIO:(https?:\/\/[^\]]+)\]/g;
    let match;
    while ((match = regex.exec(text)) !== null) urls.push(match[1]);
    return urls;
  };

  // Clean content for display
  /** @param {unknown} content */
  const cleanContent = (content) => {
    const text = typeof content === "string" ? content : String(content ?? "");
    return text.replace(/\[AUDIO:https?:\/\/[^\]]+\]/g, "🎵");
  };

  // === Siri mode (hands-free conversation) ===
  const startSiriMode = () => {
    setSiriMode(true);
    siriModeRef.current = true;
    setMessages(prev => prev.length === 0
      ? [{ role: "assistant", content: "Mode conversation vocale activé ! Parle naturellement, je t'écoute. Clique sur Stop pour arrêter." }]
      : prev
    );
    speak("Mode conversation vocale activé. Parle naturellement, je t'écoute.", () => {
      if (siriModeRef.current) setTimeout(() => siriListen(), 500);
    });
  };

  const siriListen = () => {
    if (!siriModeRef.current) return;
    startListening((transcript) => siriSend(transcript));
  };

  /** @param {string} text */
  const siriSend = async (text) => {
    if (!siriModeRef.current || !text.trim()) return;
    const mod = moderateContent(text);
    if (!mod.ok) {
      setMessages(prev => [...prev, { role: "user", content: text }, { role: "assistant", content: getModerationMessage(mod.reason) }]);
      speak(getModerationMessage(mod.reason), () => {
        if (siriModeRef.current) setTimeout(() => siriListen(), 2000);
      });
      return;
    }
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await callLLM(text);
      setMessages(prev => [...prev, { role: "assistant", content: res }]);
      speak(cleanContent(res), () => {
        if (siriModeRef.current) setTimeout(() => siriListen(), 500);
      });
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Désolé, je n'ai pas pu répondre." }]);
      if (siriModeRef.current) setTimeout(() => siriListen(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const stopSiriMode = () => {
    setSiriMode(false);
    siriModeRef.current = false;
    stopListening();
    window.speechSynthesis?.cancel();
  };

  // === Text mode ===
  /** @param {string} [text] */
  const sendMessage = async (text) => {
    const msg = (text || input || "").trim();
    if (!msg || loading) return;

    const mod = moderateContent(msg);
    if (!mod.ok) {
      setMessages(prev => [...prev,
        { role: "user", content: msg },
        { role: "assistant", content: getModerationMessage(mod.reason) }
      ]);
      setInput("");
      return;
    }

    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await callLLM(msg);
      setMessages(prev => [...prev, { role: "assistant", content: res }]);
      if (voiceModeRef.current) speak(cleanContent(res));
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Désolé, je n'ai pas pu répondre. Réessayez." }]);
    } finally {
      setLoading(false);
    }
  };

  const onMicClick = () => {
    if (listening) { stopListening(); return; }
    startListening(/** @param {string} t */ (t) => { setInput(t); sendMessage(t); });
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 lg:px-10 pt-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
              <img src="/logo.png" alt="M'baara" className="w-12 h-12 rounded-full object-cover shadow-md ring-2 ring-primary/30" />
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Kôrô</h1>
              <p className="text-xs text-muted-foreground">Assistant IA M'baara — {languages.length} langues · {vocab.length} mots en dictionnaire</p>
              {getPhonologyProfile(lang) && (
                <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-purple-500 font-medium bg-purple-500/10 px-2 py-0.5 rounded-full">
                  <Languages size={10} /> Adapté à l'accent {getPhonologyProfile(lang).name}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-green-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500" /> En ligne
            </span>
            <button onClick={() => setVoiceMode(!voiceMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${voiceMode ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              <Volume2 size={14} /> Voix
            </button>
            <button onClick={siriMode ? stopSiriMode : startSiriMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${siriMode ? "bg-red-500 text-white animate-pulse" : "bg-purple-500 text-white hover:bg-purple-600"}`}>
              <Headphones size={14} /> {siriMode ? "Stop" : "Mode Siri"}
            </button>
          </div>
        </div>

        {/* Language pills — all languages from DB */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {languages.map(l => (
            <button key={l.code} onClick={() => setLang(l.code)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                lang === l.code ? "bg-primary text-primary-foreground border border-primary" : "bg-secondary text-secondary-foreground hover:bg-secondary/70 border border-transparent"
              }`}>
              <span>{l.flag_emoji}</span> {l.name_fr}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 lg:px-10 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <img src="/logo.png" alt="M'baara" className="w-24 h-24 mx-auto mb-4 rounded-full object-cover shadow-lg ring-4 ring-primary/20" />
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Bonjour ! Je suis Kôrô</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Ton assistant IA pour apprendre les langues africaines et internationales. Pose-moi une question, ou active le <strong>Mode Siri</strong> pour converser vocalement comme avec un assistant vocal.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg mx-auto">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    className="text-left px-4 py-3 bg-card border border-border rounded-xl text-sm text-primary hover:border-primary/40 hover:bg-primary/5 transition">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => {
            const audioUrls = m.role === "assistant" ? extractAudioUrls(m.content) : [];
            const display = m.role === "assistant" ? cleanContent(m.content) : m.content;
            return (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{display}</p>
                  {m.role === "assistant" && (
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <button onClick={() => speak(display)} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                        <Volume2 size={12} /> Écouter
                      </button>
                      {audioUrls.map((url, j) => (
                        <audio key={j} controls src={url} className="h-7" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {siriMode && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-500 text-sm font-medium">
                <Mic size={16} className={listening ? "animate-pulse" : ""} />
                {listening ? "J'écoute..." : loading ? "Je réfléchis..." : "Prêt à écouter"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input — hidden in Siri mode */}
      {!siriMode && (
        <div className="px-6 lg:px-10 py-4 border-t border-border">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <button
              onClick={onMicClick}
              className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition ${
                listening ? "bg-red-500 text-white animate-pulse" : "bg-primary text-primary-foreground hover:opacity-90"
              }`}>
              {listening ? <Square size={18} /> : <Mic size={20} />}
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder={listening ? "Écoute..." : "Pose une question sur une langue..."}
              className="flex-1 bg-card border border-border rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition disabled:opacity-40">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}