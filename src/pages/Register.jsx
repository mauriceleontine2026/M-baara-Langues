import { useState } from "react";
import { register } from "@/api/authService";
import AuthSplitPanel from "@/components/AuthSplitPanel";

export default function Register() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (formPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      await register(formEmail, formPassword, name);
      setMessage("Compte créé. Consulte ta boîte mail et clique sur le lien de vérification avant de te connecter.");
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Erreur lors de l'inscription";
      const normalized = String(rawMessage || "").trim();
      setError(normalized || "Erreur lors de l'inscription");
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
    />
  );
}