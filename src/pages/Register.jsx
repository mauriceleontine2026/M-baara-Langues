import { useState } from "react";
import { register } from "@/api/authService";
import AuthSplitPanel from "@/components/AuthSplitPanel";

export default function Register() {
  const [error, setError] = useState("");
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
    if (formPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      await register(formEmail, formPassword, name);
      window.location.href = "/";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'inscription";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitPanel
      onSubmit={handleRegister}
      loading={loading}
      error={error}
      initialMode="signup"
      submitLabel="S'inscrire"
      switchLabel="Déjà inscrit ?"
      switchButtonLabel="Se connecter"
    />
  );
}