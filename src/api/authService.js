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
  return new Promise((resolve, reject) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = `${import.meta.env.VITE_API_BASE_URL || window.location.origin}/api/auth/firebase/form`;
    form.style.display = "none";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "id_token";
    input.value = idToken;
    form.appendChild(input);

    // Include CSRF token from cookie for form submission
    const csrfCookie = getCsrfTokenFromCookie();
    if (csrfCookie) {
      const csrfInput = document.createElement("input");
      csrfInput.type = "hidden";
      csrfInput.name = "_csrf_token";
      csrfInput.value = csrfCookie;
      form.appendChild(csrfInput);
    }

    // On successful form submission, the backend sets Set-Cookie headers.
    // We listen for the response and refresh auth state.
    form.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch(form.action, {
          method: form.method,
          body: new FormData(form),
          credentials: "include",
          mode: "cors",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          reject(
            new Error(
              errorData.detail || `Form auth failed with status ${response.status}`
            )
          );
          return;
        }

        const data = await response.json();
        notifyAuthChanged();
        resolve(data?.user || null);
      } catch (err) {
        reject(err);
      }
    };

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    // Fallback: if form submission seems stuck, check after a reasonable timeout
    setTimeout(() => {
      try {
        const user = getCurrentUser ? getCurrentUser() : null;
        if (user) {
          resolve(user);
        }
      } catch {
        // User still not authenticated; reject after timeout
        reject(new Error("Form-based auth timed out. Please try again."));
      }
    }, 3000);
  });
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
  return new Promise((resolve, reject) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = `${import.meta.env.VITE_API_BASE_URL || window.location.origin}/api/auth/logout/form`;
    form.style.display = "none";

    // Include CSRF token from cookie for form submission
    const csrfCookie = getCsrfTokenFromCookie();
    if (csrfCookie) {
      const csrfInput = document.createElement("input");
      csrfInput.type = "hidden";
      csrfInput.name = "_csrf_token";
      csrfInput.value = csrfCookie;
      form.appendChild(csrfInput);
    }

    form.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch(form.action, {
          method: form.method,
          body: new FormData(form),
          credentials: "include",
          mode: "cors",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          reject(
            new Error(
              errorData.detail || `Form logout failed with status ${response.status}`
            )
          );
          return;
        }

        notifyAuthChanged();
        resolve({"status": "ok"});
      } catch (err) {
        reject(err);
      }
    };

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    // Fallback timeout
    setTimeout(() => {
      try {
        notifyAuthChanged();
        resolve({"status": "ok"});
      } catch (err) {
        reject(new Error("Form-based logout timed out. Please try again."));
      }
    }, 2000);
  });
}

export async function resetPasswordRequest(email) {
  return await request("POST", "/api/auth/reset-password-request", { email });
}

export async function resetPassword(resetToken, newPassword) {
  return await request("POST", "/api/auth/reset-password", { resetToken, newPassword });
}
