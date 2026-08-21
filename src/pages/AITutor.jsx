import { useEffect, useRef, useState } from "react";
import { invokeAI } from "@/api/aiService";
import { getLanguages, getVocabularyForLanguage } from "@/api/languageService";
import { Send, Mic, Volume2, Square, Headphones, Languages, Sparkles, MessageSquareText, ArrowUpRight, CheckCircle2 } from "lucide-react";
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

const QUICK_ACTIONS = [
  { label: "Prononciation", prompt: "Corrige ma prononciation et donne-moi un exemple réel.", icon: "🎯" },
  { label: "Conversation", prompt: "Fais-moi une petite conversation en wolof pour m'entraîner.", icon: "💬" },
  { label: "Culture", prompt: "Explique-moi le contexte culturel derrière cette langue.", icon: "🌍" },
  { label: "Traduction", prompt: "Traduis-moi cette phrase et explique les nuances.", icon: "📝" },
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

    const prompt = `Tu es Kôrô, l'assistant IA de Mǎa-kwɛ́lî Langues, une plateforme d'apprentissage des langues africaines et internationales. Tu es à la fois un tuteur pédagogique, un expert en phonétique et un coach de prononciation adaptatif.

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
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Erreur inconnue";
      setMessages(prev => [...prev, { role: "assistant", content: `Désolé, je n'ai pas pu répondre. ${detail}` }]);
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
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Erreur inconnue";
      setMessages(prev => [...prev, { role: "assistant", content: `Désolé, je n'ai pas pu répondre. ${detail}` }]);
    } finally {
      setLoading(false);
    }
  };

  const onMicClick = () => {
    if (listening) { stopListening(); return; }
    startListening(/** @param {string} t */ (t) => { setInput(t); sendMessage(t); });
  };

  const activeLanguage = languages.find((item) => item.code === lang);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_28%),linear-gradient(180deg,_hsl(var(--background))_0%,_rgba(255,255,255,0.92)_100%)] px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="overflow-hidden rounded-[30px] border border-white/60 bg-white/75 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.12),_transparent_35%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src="/logo.png" alt="Mǎa-kwɛ́lî Langues" className="h-14 w-14 rounded-2xl object-cover shadow-[0_15px_35px_rgba(249,115,22,0.25)] ring-4 ring-primary/15" />
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-heading text-3xl font-bold text-foreground">Kôrô</h1>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                    Tuteur IA
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeLanguage ? `${activeLanguage.flag_emoji} ${activeLanguage.name_fr}` : "Assistant IA Mǎa-kwɛ́lî"} · {languages.length} langues · {vocab.length} mots
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-medium text-emerald-600 sm:inline-flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> En ligne
              </span>
              <button
                onClick={() => setVoiceMode(!voiceMode)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  voiceMode
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                <Volume2 size={14} /> Voix
              </button>
              <button
                onClick={siriMode ? stopSiriMode : startSiriMode}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  siriMode
                    ? "bg-red-500 text-white shadow-md shadow-red-500/30 animate-pulse"
                    : "bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700"
                }`}
              >
                <Headphones size={14} /> {siriMode ? "Stop" : "Mode Siri"}
              </button>
            </div>
          </div>

          <div className="relative mt-4 rounded-[24px] border border-primary/10 bg-gradient-to-r from-primary/8 via-orange-500/6 to-violet-500/8 p-3 shadow-inner shadow-primary/5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground/90">
                <Languages size={16} className="text-primary" />
                <span>{activeLanguage ? `Langue active : ${activeLanguage.name_fr}` : "Langue active"}</span>
              </div>
              {getPhonologyProfile(lang) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-600">
                  <Languages size={10} /> Accent {getPhonologyProfile(lang).name}
                </span>
              )}
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {languages.map(l => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                    lang === l.code
                      ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  <span>{l.flag_emoji}</span> {l.name_fr}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="mt-4 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-border/80 bg-card/80 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)] backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-foreground">Focus</h2>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                AI coach
              </span>
            </div>

            <div className="space-y-3">
              {[
                { label: "Prononciation", value: "IPA + ton", icon: "🎧" },
                { label: "Culture", value: "Historique & usages", icon: "🌍" },
                { label: "Contexte", value: "Adapté à l’accent", icon: "✨" },
                { label: "Dictionnaire", value: `${vocab.length} mots`, icon: "📚" }
              ].map(item => (
                <div key={item.label} className="rounded-[20px] border border-border bg-gradient-to-br from-secondary/50 to-white/80 px-3 py-2.5 shadow-sm dark:from-slate-900/70 dark:to-slate-950/80">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg shadow-sm dark:bg-slate-900">
                      {item.icon}
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-semibold text-foreground">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[22px] border border-dashed border-primary/30 bg-primary/5 p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Suggestions</p>
                <Sparkles size={14} className="text-primary" />
              </div>
              <div className="space-y-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    className="flex w-full items-center justify-between rounded-xl border border-transparent bg-white/75 px-3 py-2 text-left text-sm text-foreground transition hover:border-primary/20 hover:bg-primary/5 dark:bg-slate-900/70"
                  >
                    <span className="flex items-center gap-2">
                      <span>{action.icon}</span>
                      <span>{action.label}</span>
                    </span>
                    <ArrowUpRight size={14} className="text-primary" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-[22px] border border-border bg-gradient-to-br from-emerald-500/10 to-primary/10 p-3 shadow-inner shadow-emerald-500/5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Progression du jour
              </div>
              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                    <span>Prononciation</span>
                    <span>78%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/70 dark:bg-slate-900/80">
                    <div className="h-2 w-[78%] rounded-full bg-gradient-to-r from-emerald-500 to-primary" />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                    <span>Conversation</span>
                    <span>64%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/70 dark:bg-slate-900/80">
                    <div className="h-2 w-[64%] rounded-full bg-gradient-to-r from-violet-500 to-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="flex min-h-[620px] flex-col overflow-hidden rounded-[28px] border border-border/80 bg-card/80 shadow-sm backdrop-blur-sm">
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-5 lg:px-6">
              <div className="mx-auto max-w-3xl space-y-4">
                {messages.length === 0 && (
                  <div className="flex min-h-[500px] items-center justify-center">
                    <div className="w-full max-w-xl rounded-[32px] border border-border bg-gradient-to-br from-primary/8 via-orange-500/5 to-violet-500/8 p-6 text-center shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                      <div className="mb-5 flex items-center justify-center">
                        <img src="/logo.png" alt="Mǎa-kwɛ́lî Langues" className="h-24 w-24 rounded-[28px] object-cover shadow-[0_18px_45px_rgba(249,115,22,0.22)] ring-4 ring-primary/15" />
                      </div>
                      <div className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        <Sparkles size={12} />
                        <span>Coach de langue</span>
                      </div>
                      <h2 className="font-heading text-3xl font-bold text-foreground">Bonjour ! Je suis Kôrô</h2>
                      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                        Ton assistant IA pour apprendre les langues africaines et internationales. Pose-moi une question, ou active le <strong>Mode Siri</strong> pour parler naturellement.
                      </p>

                      <div className="mt-6 grid gap-2 sm:grid-cols-2">
                        {QUICK_ACTIONS.slice(0, 4).map((action) => (
                          <button
                            key={action.label}
                            onClick={() => sendMessage(action.prompt)}
                            className="flex items-center justify-between rounded-2xl border border-border bg-white/80 px-3 py-2.5 text-left text-sm text-foreground shadow-sm transition hover:border-primary/20 hover:bg-primary/5 dark:bg-slate-900/70"
                          >
                            <span className="flex items-center gap-2">
                              <span>{action.icon}</span>
                              <span>{action.label}</span>
                            </span>
                            <ArrowUpRight size={14} className="text-primary" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((m, i) => {
                  const audioUrls = m.role === "assistant" ? extractAudioUrls(m.content) : [];
                  const display = m.role === "assistant" ? cleanContent(m.content) : m.content;
                  const isUser = m.role === "user";

                  return (
                    <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-[24px] px-4 py-3 shadow-sm ring-1 ${
                        isUser
                          ? "bg-gradient-to-br from-primary to-orange-500 text-primary-foreground ring-primary/40"
                          : "border border-border bg-secondary/30 text-foreground ring-border/60"
                      }`}>
                        <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] opacity-80">
                          <span className="inline-flex items-center gap-1.5">
                            {isUser ? <MessageSquareText size={12} /> : <Sparkles size={12} />}
                            {isUser ? "Toi" : "Kôrô"}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-7">{display}</p>
                        {!isUser && (
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <button onClick={() => speak(display)} className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition hover:text-primary">
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
                    <div className="rounded-[24px] border border-border bg-secondary/30 px-4 py-3">
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        <span>Kôrô réfléchit</span>
                      </div>
                      <div className="mt-3 flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                {siriMode && (
                  <div className="pt-2 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-600">
                      <Mic size={16} className={listening ? "animate-pulse" : ""} />
                      {listening ? "J'écoute..." : loading ? "Je réfléchis..." : "Prêt à écouter"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!siriMode && (
              <div className="border-t border-border bg-background/80 px-4 py-4 backdrop-blur-sm sm:px-5 lg:px-6">
                <div className="mx-auto max-w-3xl">
                  <div className="flex items-center gap-2 rounded-[28px] border border-border bg-card p-2 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                    <button
                      onClick={onMicClick}
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition ${
                        listening ? "bg-red-500 text-white animate-pulse" : "bg-primary text-primary-foreground hover:opacity-90"
                      }`}
                    >
                      {listening ? <Square size={18} /> : <Mic size={20} />}
                    </button>

                    <input
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendMessage()}
                      placeholder={listening ? "Écoute..." : "Pose une question sur une langue..."}
                      className="flex-1 rounded-full border-0 bg-transparent px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />

                    <button
                      onClick={() => sendMessage()}
                      disabled={loading || !input.trim()}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-orange-500 text-primary-foreground shadow-[0_10px_24px_rgba(249,115,22,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}