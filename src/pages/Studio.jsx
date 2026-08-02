import { Link } from "react-router-dom";
import { Mic, Waves, Scan, Trophy, ArrowRight } from "lucide-react";

const MODULES = [
  {
    title: "Tuteur Vocal Kôrô",
    desc: "Parlez à voix haute — transcription, corrections IA et réponse parlée.",
    icon: Mic,
    to: "/tuteur",
    gradient: "from-orange-500/20 to-red-500/10",
    iconColor: "text-orange-500",
  },
  {
    title: "Atelier d'Accent",
    desc: "Comparez votre voix à un locuteur de référence — analyse spectrale en %.",
    icon: Waves,
    to: "/studio/accent",
    gradient: "from-blue-500/20 to-purple-500/10",
    iconColor: "text-blue-500",
  },
  {
    title: "Scan & Traduit",
    desc: "Photographiez un texte — OCR local gratuit, traduction et ajout à la file SRS.",
    icon: Scan,
    to: "/studio/scan",
    gradient: "from-green-500/20 to-teal-500/10",
    iconColor: "text-green-500",
  },
  {
    title: "Ligues en Direct",
    desc: "Classement hebdomadaire XP, synchronisé en temps réel entre joueurs.",
    icon: Trophy,
    to: "/studio/ligues",
    gradient: "from-yellow-500/20 to-orange-500/10",
    iconColor: "text-yellow-500",
  },
];

export default function Studio() {
  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <h1 className="font-heading text-3xl font-bold text-foreground mb-1">Studio IA &amp; Data Science</h1>
      <p className="text-muted-foreground mb-8">Les modules avancés de M'baara — voix, accent, vision et compétition.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MODULES.map(({ title, desc, icon: Icon, to, gradient, iconColor }) => (
          <Link key={to} to={to}
            className={`group bg-gradient-to-br ${gradient} via-card to-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-xl transition-all`}>
            <div className={`mb-4 ${iconColor}`}>
              <Icon size={32} />
            </div>
            <h2 className="font-heading text-xl font-bold text-foreground mb-2">{title}</h2>
            <p className="text-sm text-muted-foreground mb-4">{desc}</p>
            <div className="flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
              Ouvrir <ArrowRight size={14} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}