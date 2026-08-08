const DEFAULT_SITE_KEY = "6LcF7XstAAAAAOx7NTJcemisdJkDwT7Dgr7O7M36";

let _scriptLoading = null;

export function getRecaptchaSiteKey() {
  const configuredSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  return configuredSiteKey?.trim() || DEFAULT_SITE_KEY;
}

export function loadRecaptcha(siteKey) {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.grecaptcha && (window.grecaptcha.enterprise || window.grecaptcha.render)) return Promise.resolve();
  if (_scriptLoading) return _scriptLoading;

  _scriptLoading = new Promise((resolve, reject) => {
    try {
      // Try enterprise script first (v3-like). If enterprise isn't available
      // after load, we'll later load the v2 API as a fallback.
      const enterpriseScript = document.createElement("script");
      enterpriseScript.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(siteKey)}`;
      enterpriseScript.async = true;
      enterpriseScript.defer = true;
      enterpriseScript.onload = () => {
        // If enterprise available, resolve; otherwise try loading v2 API.
        if (window.grecaptcha && window.grecaptcha.enterprise) {
          resolve();
          return;
        }
        // Load v2 explicit-render API
        const v2Script = document.createElement("script");
        v2Script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
        v2Script.async = true;
        v2Script.defer = true;
        v2Script.onload = () => resolve();
        v2Script.onerror = () => reject(new Error("Échec du chargement du script reCAPTCHA v2."));
        document.head.appendChild(v2Script);
      };
      enterpriseScript.onerror = () => {
        // If enterprise failed to load, fall back to v2 API
        const v2Script = document.createElement("script");
        v2Script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
        v2Script.async = true;
        v2Script.defer = true;
        v2Script.onload = () => resolve();
        v2Script.onerror = () => reject(new Error("Échec du chargement du script reCAPTCHA."));
        document.head.appendChild(v2Script);
      };
      document.head.appendChild(enterpriseScript);
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

  // If enterprise API available, use it (invisible/v3-style)
  if (grecaptcha.enterprise) {
    const enterprise = grecaptcha.enterprise;
    await new Promise((resolve, reject) => {
      try {
        enterprise.ready(() => resolve());
      } catch (error) {
        reject(error);
      }
    });
    return enterprise.execute(siteKey, { action });
  }

  // Otherwise assume v2 rendered widget is present and use its response.
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

  if (grecaptcha.enterprise) {
    // enterprise doesn't render a visible checkbox; nothing to do.
    return null;
  }

  // Render explicit v2 widget into the given container.
  const widgetId = grecaptcha.render(containerId, { sitekey: siteKey });
  // store globally so getRecaptchaToken can read response
  window._mbaara_recaptcha_v2_widgetId = widgetId;
  return widgetId;
}
