const DEFAULT_SITE_KEY = "6Le6yHstAAAAAGMlso6rrFIk1z8X8L9rAvp3KGee";

let _scriptLoading = null;

export function getRecaptchaSiteKey() {
  const configuredSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  return configuredSiteKey?.trim() || DEFAULT_SITE_KEY;
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
  if (window.grecaptcha && (window.grecaptcha.enterprise || window.grecaptcha.render)) return waitForRecaptchaReady();
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
        if (window.grecaptcha) {
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
      const enterpriseScript = document.createElement("script");
      enterpriseScript.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(siteKey)}`;
      enterpriseScript.async = true;
      enterpriseScript.defer = true;
      enterpriseScript.onload = () => {
        if (window.grecaptcha && window.grecaptcha.enterprise) {
          waitForRecaptchaReady().then(resolve).catch(reject);
          return;
        }
        loadV2Script();
      };
      enterpriseScript.onerror = () => {
        loadV2Script();
      };
      document.head.appendChild(enterpriseScript);
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
