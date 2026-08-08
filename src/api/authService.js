import { request, notifyAuthChanged } from "./backendClient";
import { signInWithGoogle } from "./firebaseClient";
import { getRecaptchaToken } from "@/lib/recaptcha";

export async function login(email, password) {
  const captchaToken = await getRecaptchaToken("login");
  try {
    const data = await request("POST", "/api/auth/login", { email, password }, undefined, captchaToken);
    notifyAuthChanged();
    return data?.user || null;
  } catch (err) {
    const message = err?.message || "";
    const status = err?.status;
    // If network error or CORS issue, retry with form-based fallback
    if (message.includes("Failed to fetch") || status === 0 || !status) {
      console.warn("Login XHR failed, attempting form-based login fallback...");
      return loginWithForm(email, password);
    }
    throw err;
  }
}

/**
 * Form-based login fallback: submits email/password using FormData to
 * `/api/auth/login/form` and returns the authenticated user if successful.
 */
export async function loginWithForm(email, password) {
  const url = `${import.meta.env.VITE_API_BASE_URL || window.location.origin}/api/auth/login/form`;
  const formData = new FormData();
  formData.append("email", email);
  formData.append("password", password);

  // Try to include reCAPTCHA token if available
  try {
    const captcha = await getRecaptchaToken("login");
    if (captcha) formData.append("captcha_token", captcha);
  } catch (e) {
    // ignore captcha token failures for fallback
  }

  // Include CSRF token from cookie when available (double-submit cookie pattern)
  try {
    const csrfCookie = getCsrfTokenFromCookie();
    if (csrfCookie) {
      formData.append("_csrf_token", csrfCookie);
    }
  } catch (e) {
    // ignore cookie read errors
  }

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    credentials: "include",
    mode: "cors",
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Form login failed with status ${response.status}`);
  }

  const data = await response.json();
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
    // If XHR fetch fails with "Failed to fetch", fallback to form-based auth
    if (err?.message && err.message.includes("Failed to fetch")) {
      console.warn("XHR CORS failed, attempting form-based auth fallback...");
      return loginWithGoogleForm(token);
    }
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

/**
 * Helper: extract CSRF token from browser cookies
 */
function getCsrfTokenFromCookie() {
  const CSRF_COOKIE_NAME = "mbaara_csrf_token";
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Form-based Firebase auth: submits a hidden form to /api/auth/firebase/form
 * with id_token as application/x-www-form-urlencoded data.
 * This bypasses XHR CORS restrictions and relies on browser cookie handling.
 */
export async function loginWithGoogleForm(idToken) {
  const url = `${import.meta.env.VITE_API_BASE_URL || window.location.origin}/api/auth/firebase/form`;
  const formData = new FormData();
  formData.append("id_token", idToken);

  const csrfCookie = getCsrfTokenFromCookie();
  if (csrfCookie) {
    formData.append("_csrf_token", csrfCookie);
  }

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    credentials: "include",
    mode: "cors",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Form auth failed with status ${response.status}`);
  }

  const data = await response.json();
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
  try {
    await request("POST", "/api/auth/logout");
    notifyAuthChanged();
    return;
  } catch (err) {
    const message = err?.message || "";
    const status = err?.status;
    if (message.includes("Failed to fetch")) {
      console.warn("XHR CORS failed for logout, attempting form-based logout fallback...");
      await logoutWithForm();
      return;
    }
    if (status === 403 || message.includes("CSRF token missing or invalid")) {
      console.warn("Logout CSRF failed, retrying with form-based logout fallback...");
      await logoutWithForm();
      return;
    }
    throw err;
  }
}

/**
 * Form-based logout: submits a hidden form to /api/auth/logout/form
 * This bypasses XHR CORS restrictions.
 */
export async function logoutWithForm() {
  const url = `${import.meta.env.VITE_API_BASE_URL || window.location.origin}/api/auth/logout/form`;
  const formData = new FormData();

  const csrfCookie = getCsrfTokenFromCookie();
  if (csrfCookie) {
    formData.append("_csrf_token", csrfCookie);
  }

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    credentials: "include",
    mode: "cors",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Form logout failed with status ${response.status}`);
  }

  notifyAuthChanged();
  return { status: "ok" };
}

export async function resetPasswordRequest(email) {
  return await request("POST", "/api/auth/reset-password-request", { email });
}

export async function resetPassword(resetToken, newPassword) {
  return await request("POST", "/api/auth/reset-password", { resetToken, newPassword });
}
