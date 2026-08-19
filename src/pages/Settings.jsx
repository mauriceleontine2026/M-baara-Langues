import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Bell, Lock, UserRound, ChevronRight, Save } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const settingsItems = [
  {
    title: "Compte",
    description: "Gérez votre profil, vos préférences et vos informations personnelles.",
    icon: UserRound,
  },
  {
    title: "Sécurité",
    description: "Activez un niveau de protection supplémentaire pour votre compte.",
    icon: Lock,
  },
  {
    title: "Notifications",
    description: "Contrôlez les alertes et les rappels d’apprentissage.",
    icon: Bell,
  },
];

const SETTINGS_STORAGE_KEY = "mbaara_user_settings";

const loadSavedSettings = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY) || window.sessionStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveSettings = (snapshot) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(snapshot));
    window.sessionStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage failures when blocked or unavailable.
  }
};

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [securityAlertsEnabled, setSecurityAlertsEnabled] = useState(true);
  const [privateModeEnabled, setPrivateModeEnabled] = useState(false);
  const [activePanel, setActivePanel] = useState("notifications");
  const [saved, setSaved] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const profileSummary = useMemo(() => {
    return user?.full_name || user?.email || "Mon espace";
  }, [user]);

  useEffect(() => {
    const loaded = loadSavedSettings();
    if (loaded) {
      setNotificationsEnabled(Boolean(loaded.notificationsEnabled));
      setSecurityAlertsEnabled(Boolean(loaded.securityAlertsEnabled));
      setPrivateModeEnabled(Boolean(loaded.privateModeEnabled));
      if (loaded.updatedAt) {
        setSavedAt(loaded.updatedAt);
      }
    }
  }, []);

  const handleSave = () => {
    const snapshot = {
      notificationsEnabled,
      securityAlertsEnabled,
      privateModeEnabled,
      updatedAt: new Date().toISOString(),
    };
    saveSettings(snapshot);
    setSavedAt(snapshot.updatedAt);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="space-y-6 px-4 py-6">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl bg-primary/15 p-2 text-primary">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Réglages, Paramètres & Confidentialité</h1>
            <p className="text-sm text-muted-foreground">Centralisez vos préférences et votre sécurité.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {settingsItems.map(({ title, description, icon: Icon }) => (
            <button
              key={title}
              type="button"
              onClick={() => title === "Compte" ? navigate("/profil") : setActivePanel(title === "Sécurité" ? "security" : "notifications")}
              className={`group rounded-2xl border bg-secondary/40 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5 ${activePanel === (title === "Sécurité" ? "security" : title === "Notifications" ? "notifications" : "") ? "border-primary/50 ring-2 ring-primary/15" : "border-border"}`}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-background text-primary">
                <Icon size={18} />
              </div>
              <div className="text-sm font-semibold text-foreground">{title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              <div className="mt-3 text-xs font-semibold text-primary">{title === "Compte" ? "Ouvrir mon profil →" : "Gérer maintenant →"}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Préférences de confidentialité</h2>
            <p className="text-sm text-muted-foreground">{profileSummary}</p>
          </div>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Save size={16} />
            Enregistrer
          </button>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setActivePanel("notifications")} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${activePanel === "notifications" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary"}`}>Notifications</button>
          <button type="button" onClick={() => setActivePanel("security")} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${activePanel === "security" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary"}`}>Sécurité & confidentialité</button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {activePanel === "notifications" && <label className="flex items-center justify-between rounded-2xl border border-border bg-secondary/40 p-4">
            <div>
              <div className="font-medium text-foreground">Notifications d’apprentissage</div>
              <div className="text-sm text-muted-foreground">Rappels et alertes du programme.</div>
            </div>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(event) => setNotificationsEnabled(event.target.checked)}
            />
          </label>}

          {activePanel === "security" && <label className="flex items-center justify-between rounded-2xl border border-border bg-secondary/40 p-4">
            <div>
              <div className="font-medium text-foreground">Alertes de sécurité</div>
              <div className="text-sm text-muted-foreground">Recevoir les notifications de sécurité.</div>
            </div>
            <input
              type="checkbox"
              checked={securityAlertsEnabled}
              onChange={(event) => setSecurityAlertsEnabled(event.target.checked)}
            />
          </label>}

          {activePanel === "security" && <label className="flex items-center justify-between rounded-2xl border border-border bg-secondary/40 p-4 md:col-span-2">
            <div>
              <div className="font-medium text-foreground">Mode privé</div>
              <div className="text-sm text-muted-foreground">Masquer certaines informations de profil dans les sections publiques.</div>
            </div>
            <input
              type="checkbox"
              checked={privateModeEnabled}
              onChange={(event) => setPrivateModeEnabled(event.target.checked)}
            />
          </label>}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/profil")}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground"
          >
            <UserRound size={16} />
            Voir mon profil
          </button>
          <button
            onClick={() => navigate("/support")}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground"
          >
            <ChevronRight size={16} />
            Assistance
          </button>
        </div>

        {saved ? (
          <div className="mt-4 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
            Préférences enregistrées avec succès.
          </div>
        ) : null}
        {savedAt ? (
          <div className="mt-3 text-xs text-muted-foreground">
            Dernière sauvegarde : {new Date(savedAt).toLocaleString("fr-FR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
