import { request, notifyAuthChanged, clearStoredAccessToken } from "./backendClient";
import { signInWithGoogle } from "./firebaseClient";

export async function login(email, password) {
  const data = await request("POST", "/api/auth/login", { email, password });
  notifyAuthChanged();
  return data?.user || null;
}

export async function loginWithGoogle() {
  const { token } = await signInWithGoogle();
  if (!token) {
    throw new Error("Jeton Firebase introuvable après authentification Google.");
  }

  const data = await request("POST", "/api/auth/firebase", { id_token: token });
  notifyAuthChanged();
  return data?.user || null;
}

export async function register(email, password, full_name) {
  const data = await request("POST", "/api/auth/register", { email, password, full_name });
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
  try {
    await request("POST", "/api/auth/logout");
  } finally {
    clearStoredAccessToken();
    notifyAuthChanged();
  }
}

export async function resetPasswordRequest(email) {
  return await request("POST", "/api/auth/reset-password-request", { email });
}

export async function resetPassword(resetToken, newPassword) {
  return await request("POST", "/api/auth/reset-password", { resetToken, newPassword });
}
