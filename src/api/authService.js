import { request, notifyAuthChanged } from "./backendClient";
import { signInWithGoogle } from "./firebaseClient";
import { getRecaptchaToken } from "@/lib/recaptcha";

export async function login(email, password) {
  const captchaToken = await getRecaptchaToken("login");
  const data = await request("POST", "/api/auth/login", { email, password }, undefined, captchaToken);
  notifyAuthChanged();
  return data?.user || null;
}

export async function loginWithGoogle() {
  const { token } = await signInWithGoogle();
  if (!token) {
    throw new Error("Jeton Firebase introuvable après authentification Google.");
  }

  // Quick health check to provide a clearer error if the backend is unreachable
  try {
    await request("GET", "/api/health");
  } catch (err) {
    throw new Error(
      `Impossible de contacter le backend avant l'échange du jeton Firebase. Vérifiez la configuration de \
      VITE_API_BASE_URL et la connectivité réseau. Détails: ${err?.message || err}`
    );
  }

  let data;
  try {
    data = await request("POST", "/api/auth/firebase", { id_token: token });
  } catch (err) {
    // Provide actionable guidance when the network request itself failed
    if (err?.message && err.message.includes("Impossible de contacter le serveur")) {
      throw new Error(
        `Échec de l'appel à ${import.meta.env.VITE_API_BASE_URL || window.location.origin}/api/auth/firebase — ${err.message}`
      );
    }
    throw err;
  }
  notifyAuthChanged();
  return data?.user || null;
}

export async function register(email, password, full_name) {
  const captchaToken = await getRecaptchaToken("register");
  const data = await request("POST", "/api/auth/register", { email, password, full_name }, undefined, captchaToken);
  notifyAuthChanged();
  return data?.user || null;
}

export async function getCurrentUser() {
  return await request("GET", "/api/auth/me");
}

export async function updateMe(payload) {
  return await request("PUT", "/api/auth/me", payload);
}

export async function logout() {
  await request("POST", "/api/auth/logout");
  notifyAuthChanged();
}

export async function resetPasswordRequest(email) {
  return await request("POST", "/api/auth/reset-password-request", { email });
}

export async function resetPassword(resetToken, newPassword) {
  return await request("POST", "/api/auth/reset-password", { resetToken, newPassword });
}
