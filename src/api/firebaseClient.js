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



// Superseded: Firebase client no longer used. The project now uses Supabase.
// Keep this file as a marker for the migration; other modules import
// `signInWithGoogle` from `src/api/supabaseClient` now.
export const useFirebase = false;
export const firebaseConfigIsValid = false;
export const db = null;
export const firebaseAuth = null;
export async function signInWithGoogle() {
  throw new Error("Firebase client is no longer used. Please use Supabase client instead.");
}
