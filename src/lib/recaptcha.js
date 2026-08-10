const DEFAULT_SITE_KEY = "6LcF7XstAAAAAOx7NTJcemisdJkDwT7Dgr7O7M36";

let _scriptLoading = null;

function waitForV2Renderer(resolve, reject) {
  const startedAt = Date.now();
  const check = () => {
    if (window.grecaptcha && typeof window.grecaptcha.render === "function") {
      resolve();
      return;
    }
    if (Date.now() - startedAt > 10000) {
      reject(new Error("Le widget reCAPTCHA v2 ne s'est pas initialisé."));
      return;
    }
    setTimeout(check, 100);
  };
  check();
}

export function getRecaptchaSiteKey() {
  const configuredSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  return configuredSiteKey?.trim() || DEFAULT_SITE_KEY;
}

export function loadRecaptcha(siteKey) {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.grecaptcha && typeof window.grecaptcha.render === "function" && !window.grecaptcha.enterprise) return Promise.resolve();
  if (_scriptLoading) return _scriptLoading;

  _scriptLoading = new Promise((resolve, reject) => {
    try {
      const v2Script = document.createElement("script");
      v2Script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      v2Script.async = true;
      v2Script.defer = true;
      v2Script.onload = () => waitForV2Renderer(resolve, reject);
      v2Script.onerror = () => reject(new Error("Échec du chargement du script reCAPTCHA v2."));
      document.head.appendChild(v2Script);
    } catch (err) {
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

  // Render explicit v2 widget into the given container.
  if (typeof window._mbaara_recaptcha_v2_widgetId !== "undefined" && window._mbaara_recaptcha_v2_widgetId !== null) {
    return window._mbaara_recaptcha_v2_widgetId;
  }

  const widgetId = grecaptcha.render(containerId, { sitekey: siteKey });
  // store globally so getRecaptchaToken can read response
  window._mbaara_recaptcha_v2_widgetId = widgetId;
  return widgetId;
}
