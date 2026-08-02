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
    const email = typeof values?.email === "string" ? values.email : "";
    const password = typeof values?.password === "string" ? values.password : "";
    const mode = values?.mode;
    if (mode === "signup") {
      window.location.href = "/register";
      return;
    }

    setError("");
    setLoading(true);
    try {
      await login(email, password);
      window.location.href = "/";
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Identifiants incorrects";
      setError(errorMessage);
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