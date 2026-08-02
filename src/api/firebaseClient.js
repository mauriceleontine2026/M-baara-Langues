import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const useFirebase = env.VITE_USE_FIREBASE === "true";
export const firebaseConfigIsValid = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
);

let firebaseApp;
let firestore;
let auth;

export const firebaseAuthReady = async () => {
  if (!useFirebase || !firebaseConfigIsValid || !auth) {
    return null;
  }

  return new Promise((resolve, reject) => {
    let resolved = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (!resolved) {
          resolved = true;
          resolve(user);
          unsubscribe();
        }
        return;
      }

      try {
        const result = await signInAnonymously(auth);
        if (!resolved) {
          resolved = true;
          resolve(result.user);
        }
      } catch (error) {
        console.warn("Firebase anonymous auth failed:", error);
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      } finally {
        unsubscribe();
      }
    }, (error) => {
      console.warn("Firebase auth state failed:", error);
      if (!resolved) {
        resolved = true;
        reject(error);
      }
      unsubscribe();
    });
  });
};

if (useFirebase && firebaseConfigIsValid) {
  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  firestore = getFirestore(firebaseApp);
  auth = getAuth(firebaseApp);
} else if (useFirebase) {
  console.warn("Firebase is enabled via VITE_USE_FIREBASE but Firebase config is missing or incomplete.");
}

export const db = firestore;
export const firebaseAuth = auth;

export async function signInWithGoogle() {
  if (!useFirebase || !firebaseConfigIsValid || !auth) {
    throw new Error("Firebase n'est pas configuré pour Google Sign-In.");
  }

  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    if (!result.user) {
      throw new Error("Impossible de récupérer l'utilisateur Google.");
    }

    const idToken = await result.user.getIdToken();
    return { user: result.user, token: idToken };
  } catch (error) {
    if (error?.code === "auth/unauthorized-domain") {
      throw new Error(
        "Le domaine de ce site n'est pas autorisé dans Firebase Authentication. Ajoutez le domaine du frontend (ex. mbaara-web.vercel.app) dans Firebase Console → Authentication → Settings → Authorized domains."
      );
    }

    throw error;
  }
}
