const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
  }

  if (import.meta.env.DEV) {
    return "http://127.0.0.1:8000";
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
};

// The access token itself now lives only in an httpOnly cookie the backend
// sets on login (see backend/app/services/security.py:set_auth_cookies) —
// JS never reads or stores it, so an XSS payload can't exfiltrate it from
// storage. Every request is sent with credentials so the browser attaches
// that cookie automatically; login/register calls still notify listeners so
// the rest of the app (AuthContext) knows to re-check "who am I".
const CSRF_COOKIE_NAME = "mbaara_csrf_token";
const ACCESS_TOKEN_STORAGE_KEY = "mbaara_access_token";

const getCsrfToken = () => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const getStoredAccessToken = () => {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

const persistAccessToken = (token) => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    if (token) {
      window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore localStorage failures on restricted browsers.
  }
};

const clearStoredAccessToken = () => {
  persistAccessToken(null);
};

const notifyAuthChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mbaara-auth-changed"));
  }
};

const buildApiUrl = (path) => {
  const API_BASE_URL = getApiBaseUrl();
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is not configured. Set it to your deployed backend base URL.");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${API_BASE_URL}/`);
};

const formatErrorMessage = (data, fallback) => {
  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  if (Array.isArray(data?.detail)) {
    const first = data.detail[0];
    if (typeof first?.msg === "string" && first.msg.trim()) {
      return first.msg.trim();
    }
  }

  if (typeof data?.detail === "string" && data.detail.trim()) {
    return data.detail.trim();
  }

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message.trim();
  }

  return fallback;
};

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const request = async (method, path, body, queryParams) => {
  const url = buildApiUrl(path);
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  /** @type {{ [key: string]: string }} */
  const headers = {
    Accept: "application/json",
  };
  if (MUTATING_METHODS.has(method.toUpperCase())) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
  }

  const accessToken = getStoredAccessToken();
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let bodyValue;
  if (body && !(body instanceof FormData)) {
    Object.assign(headers, { "Content-Type": "application/json" });
    bodyValue = JSON.stringify(body);
  } else {
    bodyValue = body;
  }

  let response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: bodyValue,
      credentials: "include",
      mode: "cors",
      cache: "no-store",
    });
  } catch (fetchError) {
    const message =
      fetchError instanceof Error
        ? fetchError.message
        : String(fetchError);
    throw new Error(
      `Impossible de contacter le serveur (${method} ${url.toString()}). Vérifiez votre connexion réseau et l'URL du backend. (${message})`
    );
  }

  const contentType = response.headers.get("content-type") || "";
  let data = null;
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearStoredAccessToken();
    }
    const error = new Error(formatErrorMessage(data, response.statusText || "Request failed"));
    Object.assign(error, {
      status: response.status,
      data,
    });
    throw error;
  }

  if (data?.access_token && typeof data.access_token === "string") {
    persistAccessToken(data.access_token);
  }

  return data;
};

export { notifyAuthChanged, request, clearStoredAccessToken };
