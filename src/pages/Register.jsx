import { useState } from "react";
import { register } from "@/api/authService";
import AuthSplitPanel from "@/components/AuthSplitPanel";

export default function Register() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  /**
   * @param {{ email: string; password: string; confirmPassword: string; name: string; mode: string }} props
   */
  const handleRegister = async ({ email: formEmail, password: formPassword, confirmPassword, name, mode }) => {
    if (mode === "signin") {
      window.location.href = "/login";
      return;
    }

    setError("");
    setMessage("");
    setAlreadyRegistered(false);
    if (formPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    const normalizedEmail = typeof formEmail === "string" ? formEmail.trim() : "";
    setLoading(true);
    try {
      const result = await register(normalizedEmail, formPassword, name);
      if (result?.verification_required === false) {
        setMessage("Compte créé. Votre adresse e-mail est déjà vérifiée, vous pouvez vous connecter immédiatement.");
      } else if (result?.message) {
        setMessage(result.message);
      } else {
        setMessage("Compte créé. Consultez votre boîte mail et cliquez sur le lien de vérification avant de vous connecter.");
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Erreur lors de l'inscription";
      const normalized = String(rawMessage || "").trim();
      if (err?.status === 409 || normalized.toLowerCase().includes("already") || normalized.toLowerCase().includes("déjà")) {
        setAlreadyRegistered(true);
        setError("Cette adresse e-mail est déjà utilisée. Connectez-vous avec ce compte ou réinitialisez votre mot de passe.");
      } else {
        setError(normalized || "Erreur lors de l'inscription");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitPanel
      onSubmit={handleRegister}
      loading={loading}
      error={error}
      message={message}
      initialMode="signup"
      submitLabel="S'inscrire"
      switchLabel="Déjà inscrit ?"
      switchButtonLabel="Se connecter"
    >
      {alreadyRegistered ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center text-sm">
          <a href="/login" className="font-semibold text-primary hover:underline">Aller à la connexion</a>
          <span className="mx-2 text-muted-foreground">ou</span>
          <a href="/forgot-password" className="font-semibold text-primary hover:underline">Réinitialiser le mot de passe</a>
        </div>
      ) : null}
    </AuthSplitPanel>
  );
}