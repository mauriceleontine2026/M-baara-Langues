const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://127.0.0.1:8000" : "https://mbaara-backend.vercel.app")
).replace(/\/$/, "");

let inMemoryToken = null;

const getSessionStorage = () => {
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  return window.sessionStorage;
};

const getAuthToken = () => {
  if (typeof window !== "undefined") {
    const storedToken = window.sessionStorage.getItem("mbaara_auth_token");
    if (storedToken) {
      inMemoryToken = storedToken;
      return storedToken;
    }
  }
  return inMemoryToken;
};

const setAuthToken = (token) => {
  inMemoryToken = token;
  if (typeof window !== "undefined") {
    const storage = getSessionStorage();
    if (storage) {
      if (token) {
        storage.setItem("mbaara_auth_token", token);
      } else {
        storage.removeItem("mbaara_auth_token");
      }
    }
    window.dispatchEvent(new Event("mbaara-auth-changed"));
  }
};

const clearAuthToken = () => {
  inMemoryToken = null;
  if (typeof window !== "undefined") {
    const storage = getSessionStorage();
    if (storage) {
      storage.removeItem("mbaara_auth_token");
    }
    window.dispatchEvent(new Event("mbaara-auth-changed"));
  }
};

const buildApiUrl = (path) => {
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
  const headers = {};
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let bodyValue;
  if (body && !(body instanceof FormData)) {
    Object.assign(headers, { "Content-Type": "application/json" });
    bodyValue = JSON.stringify(body);
  } else {
    bodyValue = body;
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: bodyValue,
  });

  const contentType = response.headers.get("content-type") || "";
  let data = null;
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const error = new Error(formatErrorMessage(data, response.statusText || "Request failed"));
    Object.assign(error, {
      status: response.status,
      data,
    });
    throw error;
  }

  return data;
};

export { getAuthToken, setAuthToken, clearAuthToken, request };
