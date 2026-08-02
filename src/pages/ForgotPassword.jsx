import { useState } from "react";
import { resetPasswordRequest } from "@/api/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * @param {import("react").FormEvent<HTMLFormElement>} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPasswordRequest(email);
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible d'envoyer le lien de réinitialisation";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="M'baara" className="w-24 h-24 rounded-full shadow-lg mb-3 object-cover ring-2 ring-primary/30" />
          <h1 className="font-heading text-2xl font-bold text-foreground">M'baara Langues</h1>
        </div>
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-3">📧</div>
              <h2 className="font-heading text-lg font-bold text-foreground mb-2">Email envoyé !</h2>
              <p className="text-sm text-muted-foreground">Si un compte existe pour cet email, vous recevrez un lien de réinitialisation.</p>
              <a href="/login" className="mt-4 block text-primary font-semibold hover:underline text-sm">← Retour à la connexion</a>
            </div>
          ) : (
            <>
              <h2 className="font-heading text-xl font-bold text-foreground mb-2 text-center">Mot de passe oublié</h2>
              <p className="text-sm text-muted-foreground text-center mb-5">Entrez votre email pour recevoir un lien de réinitialisation.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-border bg-background rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="votre@email.com" required />
                <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-60">
                  {loading ? "Envoi..." : "Envoyer le lien"}
                </button>
              </form>
              <a href="/login" className="mt-4 block text-center text-sm text-primary hover:underline">← Retour à la connexion</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}