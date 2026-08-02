import { useEffect, useState } from "react";
import { createVocabulary } from "@/api/languageService";
import { listContributions, updateContribution } from "@/api/contributionService";
import { CheckCircle, XCircle, Hourglass, Play } from "lucide-react";

export default function AdminContributions({ languages }) {
  const [contributions, setContributions] = useState([]);
  const [filter, setFilter] = useState("pending");

  const fetch = async () => {
    try {
      const data = await listContributions();
      setContributions(Array.isArray(data) ? data : []);
    } catch {
      setContributions([]);
    }
  };
  useEffect(() => { fetch(); }, []);

  const approve = async (c) => {
    await updateContribution(c.id, { status: "approved" });
    try {
      await createVocabulary({
        language_code: c.language_code,
        word: c.word,
        translation_fr: c.translation_fr,
        phonetic: c.phonetic,
        audio_url: c.audio_url,
        lesson_number: 1,
      });
    } catch { /* may already exist */ }
    fetch();
  };

  const reject = async (c) => {
    await updateContribution(c.id, { status: "rejected" });
    fetch();
  };

  const filtered = contributions.filter(c => filter === "all" || c.status === filter);

  const statusInfo = {
    pending: { icon: Hourglass, color: "text-yellow-500", label: "En attente" },
    approved: { icon: CheckCircle, color: "text-green-500", label: "Validé" },
    rejected: { icon: XCircle, color: "text-red-500", label: "Refusé" },
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {["pending", "approved", "rejected", "all"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {f === "all" ? "Toutes" : f === "pending" ? "En attente" : f === "approved" ? "Validées" : "Refusées"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(c => {
          const lang = languages.find(l => l.code === c.language_code);
          const si = statusInfo[c.status];
          return (
            <div key={c.id} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{lang?.flag_emoji || "🌍"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-lg font-bold text-foreground">{c.word}</span>
                    {c.phonetic && <span className="text-sm text-primary font-mono">{c.phonetic}</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">→ {c.translation_fr}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {lang?.name_fr || c.language_code} {c.region && `· ${c.region}`} {c.contributor_name && `· par ${c.contributor_name}`}
                  </div>
                  {c.context_notes && <div className="text-xs text-muted-foreground mt-1 italic">"{c.context_notes}"</div>}
                  {c.audio_url && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Play size={12} className="text-primary" />
                      <audio controls src={c.audio_url} className="h-6" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs flex items-center gap-1 ${si.color}`}>
                    <si.icon size={12} /> {si.label}
                  </span>
                  {c.status === "pending" && (
                    <div className="flex gap-1">
                      <button onClick={() => approve(c)} className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition" title="Valider">
                        <CheckCircle size={18} />
                      </button>
                      <button onClick={() => reject(c)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition" title="Refuser">
                        <XCircle size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Aucune contribution</p>}
      </div>
    </div>
  );
}