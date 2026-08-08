import { useState } from "react";
import { login, loginWithGoogle } from "@/api/authService";
import AuthSplitPanel from "@/components/AuthSplitPanel";

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      window.location.href = "/";
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : "Connexion Google impossible";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (/** @type {any} */ values) => {
    const email = typeof values?.email === "string" ? values.email.trim() : "";
    const password = typeof values?.password === "string" ? values.password : "";
    const mode = values?.mode;
    if (mode === "signup") {
      window.location.href = "/register";
      return;
    }

    if (!email || !password) {
      setError("Email et mot de passe sont requis.");
      return;
    }

    const emailPattern = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
    if (!emailPattern.test(email)) {
      setError("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    if (password.length < 12) {
      setError("Le mot de passe doit contenir au moins 12 caractères.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await login(email, password);
      window.location.href = "/";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Identifiants incorrects";
      const normalized = String(message || "").trim();
      if (normalized.includes("Email not verified") || normalized.includes("email non vérifié") || normalized.includes("vérifié")) {
        setError("Votre adresse e-mail doit être vérifiée avant de vous connecter.");
      } else {
        setError(normalized || "Identifiants incorrects");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitPanel
      onSubmit={handleSubmit}
      onGoogle={handleGoogle}
      loading={loading}
      error={error}
      initialMode="signin"
      submitLabel="Se connecter"
      switchLabel="Pas encore de compte ?"
      switchButtonLabel="Créer un compte"
    />
  );
}