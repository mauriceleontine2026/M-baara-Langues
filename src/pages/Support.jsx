import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Headphones, MessageCircle, BookOpenText, ArrowRight, Mail, Settings2 } from "lucide-react";

const supportItems = [
  {
    title: "Centre d'aide",
    description: "Consultez les conseils rapides et la documentation de l'application.",
    icon: BookOpenText,
    actionLabel: "Voir les FAQ",
    details: "Commencez par vérifier vos rappels de connexion, vos accès à l’API et vos réglages de confidentialité pour résoudre les problèmes courants.",
  },
  {
    title: "Support",
    description: "Contactez l'équipe pour obtenir une assistance personnalisée.",
    icon: Headphones,
    actionLabel: "Contacter le support",
    details: "Envoyez un message à l’équipe de support pour un cas précis, un bug ou une demande sur votre profil.",
  },
  {
    title: "Feedback",
    description: "Partagez vos idées pour améliorer l'expérience d'apprentissage.",
    icon: MessageCircle,
    actionLabel: "Partager un retour",
    details: "Vos retours permettent de prioriser les améliorations de navigation, de contenu et de progression.",
  },
];

export default function Support() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  const activeItem = supportItems[activeIndex];

  const handleMailTo = () => {
    window.location.href = "mailto:support@m-baara.app?subject=Demande%20d'assistance%20M%C7%8Ea-kw%C9%9Bl%C3%AE";
  };

  return (
    <div className="space-y-6 px-4 py-6">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl bg-primary/15 p-2 text-primary">
            <Headphones size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Centre d'aide / Support</h1>
            <p className="text-sm text-muted-foreground">Accédez à l’assistance et aux ressources utiles.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {supportItems.map(({ title, description, icon: Icon }, index) => (
            <button
              key={title}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="rounded-2xl border border-border bg-secondary/40 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-background text-primary">
                <Icon size={18} />
              </div>
              <div className="text-sm font-semibold text-foreground">{title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
          <Headphones size={16} />
          Assistant de support
        </div>
        <h2 className="text-lg font-bold text-foreground">{activeItem.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{activeItem.details}</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleMailTo}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Mail size={16} />
            {activeItem.actionLabel}
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground"
          >
            <Settings2 size={16} />
            Ouvrir les réglages
          </button>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground"
          >
            <ArrowRight size={16} />
            Retour à l’accueil
          </button>
        </div>
      </div>
    </div>
  );
}
