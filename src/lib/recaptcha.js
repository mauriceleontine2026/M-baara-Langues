const DEFAULT_SITE_KEY = "6LefxXstAAAAAG3F8XkSxnREAnVwSO0o1jOQKWJq";

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
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(siteKey)}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (e) => reject(new Error("Échec du chargement du script reCAPTCHA."));
      document.head.appendChild(script);
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

  // Prefer enterprise API when available (v3-like execute), fallback to
  // enterprise.ready + execute.
  const enterprise = grecaptcha.enterprise;
  if (!enterprise) {
    throw new Error("La version requise de reCAPTCHA n'est pas disponible.");
  }

  await new Promise((resolve, reject) => {
    try {
      enterprise.ready(() => resolve());
    } catch (error) {
      reject(error);
    }
  });

  return enterprise.execute(siteKey, { action });
}
