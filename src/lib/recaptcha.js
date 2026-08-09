const DEFAULT_SITE_KEY = import.meta.env.DEV ? "6LcF7XstAAAAAOx7NTJcemisdJkDwT7Dgr7O7M36" : null;

let _scriptLoading = null;

export function getRecaptchaSiteKey() {
  const configuredSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (configuredSiteKey?.trim()) {
    return configuredSiteKey.trim();
  }
  return DEFAULT_SITE_KEY;
}

function waitForRecaptchaReady() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    if (!window.grecaptcha || typeof window.grecaptcha.ready !== "function") return resolve();
    try {
      window.grecaptcha.ready(() => resolve());
    } catch {
      resolve();
    }
  });
}

export function loadRecaptcha(siteKey) {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.grecaptcha && typeof window.grecaptcha.render === "function") return waitForRecaptchaReady();
  if (_scriptLoading) return _scriptLoading;

  _scriptLoading = new Promise((resolve, reject) => {
    const cleanup = () => {
      _scriptLoading = null;
    };

    const loadV2Script = () => {
      const v2Script = document.createElement("script");
      v2Script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      v2Script.async = true;
      v2Script.defer = true;
      v2Script.onload = () => {
        if (window.grecaptcha && typeof window.grecaptcha.render === "function") {
          waitForRecaptchaReady().then(resolve).catch(reject);
          return;
        }
        cleanup();
        reject(new Error("Le script reCAPTCHA v2 s'est chargé, mais le service n'est pas disponible."));
      };
      v2Script.onerror = () => {
        cleanup();
        reject(new Error("Échec du chargement du script reCAPTCHA v2."));
      };
      document.head.appendChild(v2Script);
    };

    try {
      loadV2Script();
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
  return _scriptLoading;
}

export async function getRecaptchaToken(action = "login") {
  const siteKey = getRecaptchaSiteKey();

  if (!siteKey || typeof window === "undefined") {
    return null;
  }

  // Ensure the script is loaded (handles SPA navigation where index.html
  // may not have fully initialized the grecaptcha object yet).
  await loadRecaptcha(siteKey);

  const grecaptcha = window.grecaptcha;
  if (!grecaptcha) {
    throw new Error("Le service de vérification anti-bot n'est pas prêt. Veuillez recharger la page.");
  }

  const widgetId = window._mbaara_recaptcha_v2_widgetId;
  if (typeof widgetId !== "undefined" && widgetId !== null) {
    const token = grecaptcha.getResponse(widgetId);
    if (!token || !token.trim()) {
      throw new Error("Veuillez compléter le contrôle reCAPTCHA.");
    }
    return token;
  }

  throw new Error("Aucun widget reCAPTCHA disponible.");
}

export async function renderRecaptcha(containerId, siteKey) {
  if (typeof window === "undefined") return null;
  await loadRecaptcha(siteKey);
  const grecaptcha = window.grecaptcha;
  if (!grecaptcha) throw new Error("grecaptcha indisponible");

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container reCAPTCHA introuvable: ${containerId}`);
  }

  if (typeof window._mbaara_recaptcha_v2_widgetId !== "undefined" && window._mbaara_recaptcha_v2_widgetId !== null) {
    return window._mbaara_recaptcha_v2_widgetId;
  }

  if (container.childElementCount > 0) {
    const existingId = window._mbaara_recaptcha_v2_widgetId;
    if (typeof existingId !== "undefined" && existingId !== null) {
      return existingId;
    }
  }

  const widgetId = grecaptcha.render(containerId, {
    sitekey: siteKey,
    callback: () => {
      window._mbaara_recaptcha_v2_hasResponse = true;
    },
    "expired-callback": () => {
      window._mbaara_recaptcha_v2_hasResponse = false;
    },
    "error-callback": () => {
      window._mbaara_recaptcha_v2_hasResponse = false;
    },
  });
  window._mbaara_recaptcha_v2_widgetId = widgetId;
  return widgetId;
}
