import { collection, getDocs, query, where } from "firebase/firestore";
import { db, firebaseConfigIsValid, useFirebase } from "./firebaseClient";

let firebaseAccessBlocked = false;
let firebaseAccessWarningLogged = false;

const isPermissionError = (error) => {
  const code = error?.code || "";
  const message = String(error?.message || "").toLowerCase();
  return code === "permission-denied" || message.includes("insufficient permissions");
};

const handleFirebaseError = (error, label) => {
  if (isPermissionError(error)) {
    firebaseAccessBlocked = true;
    if (!firebaseAccessWarningLogged) {
      // eslint-disable-next-line no-console
      console.warn("Firebase Firestore access blocked by security rules. Read operations are disabled until permissions are fixed.");
      firebaseAccessWarningLogged = true;
    }
  }
  // eslint-disable-next-line no-console
  console.error(`Firebase ${label} fetch error:`, error);
};

export const isFirebaseAccessAllowed = () => !firebaseAccessBlocked;

export async function getLanguagesFromFirebase() {
  if (!useFirebase || !firebaseConfigIsValid || firebaseAccessBlocked) {
    return [];
  }

  try {
    const languagesRef = collection(db, "languages");
    const q = query(languagesRef, where("active", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirebaseError(error, "language");
    return [];
  }
}

export async function getLanguageByCodeFromFirebase(code) {
  if (!useFirebase || !firebaseConfigIsValid || firebaseAccessBlocked || !code) {
    return null;
  }

  try {
    const languagesRef = collection(db, "languages");
    const q = query(languagesRef, where("code", "==", code));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return docs.length > 0 ? docs[0] : null;
  } catch (error) {
    handleFirebaseError(error, "language");
    return null;
  }
}

export async function getVocabularyFromFirebase(languageCode) {
  if (!useFirebase || !firebaseConfigIsValid || firebaseAccessBlocked || !languageCode) {
    return [];
  }

  try {
    const vocabRef = collection(db, "vocabulary");
    const q = query(vocabRef, where("language_code", "==", languageCode));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirebaseError(error, "vocabulary");
    return [];
  }
}

export async function getVocabularyByLessonFromFirebase(languageCode, lessonNumber) {
  if (!useFirebase || !firebaseConfigIsValid || firebaseAccessBlocked || !languageCode || lessonNumber == null) {
    return [];
  }

  try {
    const vocabRef = collection(db, "vocabulary");
    const q = query(
      vocabRef,
      where("language_code", "==", languageCode),
      where("lesson_number", "==", lessonNumber)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirebaseError(error, "vocabulary");
    return [];
  }
}

export async function getLessonsFromFirebase(languageCode) {
  if (!useFirebase || !firebaseConfigIsValid || firebaseAccessBlocked || !languageCode) {
    return [];
  }

  try {
    const lessonsRef = collection(db, "lessons");
    const q = query(lessonsRef, where("language_code", "==", languageCode));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirebaseError(error, "lessons");
    return [];
  }
}

export async function getAllVocabularyFromFirebase() {
  if (!useFirebase || !firebaseConfigIsValid || firebaseAccessBlocked) {
    return [];
  }

  try {
    const vocabRef = collection(db, "vocabulary");
    const snapshot = await getDocs(vocabRef);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirebaseError(error, "vocabulary");
    return [];
  }
}

export async function getAllLessonsFromFirebase() {
  if (!useFirebase || !firebaseConfigIsValid || firebaseAccessBlocked) {
    return [];
  }

  try {
    const lessonsRef = collection(db, "lessons");
    const snapshot = await getDocs(lessonsRef);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirebaseError(error, "lessons");
    return [];
  }
}
