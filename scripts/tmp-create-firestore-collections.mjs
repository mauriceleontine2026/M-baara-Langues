import { initializeApp } from 'firebase/app/dist/index.cjs.js';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore/dist/index.cjs.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDJv9HiIhR_qTlmAX_SUX8Fn6ogTeE8NBc',
  authDomain: 'm-baara-langues.firebaseapp.com',
  projectId: 'm-baara-langues',
  storageBucket: 'm-baara-langues.firebasestorage.app',
  messagingSenderId: '880565684611',
  appId: '1:880565684611:web:8c817cd0576236c826ceb6',
  measurementId: 'G-LBNCY8C8QD',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const placeholders = [
  {
    collection: 'languages',
    id: '__placeholder__',
    data: {
      name: 'Placeholder language',
      code: 'xx',
      active: false,
      createdAt: serverTimestamp(),
    },
  },
  {
    collection: 'vocabulary',
    id: '__placeholder__',
    data: {
      language_code: 'xx',
      word: 'placeholder',
      translation: 'placeholder',
      createdAt: serverTimestamp(),
    },
  },
  {
    collection: 'lessons',
    id: '__placeholder__',
    data: {
      title: 'Placeholder lesson',
      language_code: 'xx',
      level: 'A1',
      type: 'vocabulary',
      order: 1,
      lesson_number: 1,
      is_published: false,
      createdAt: serverTimestamp(),
    },
  },
  {
    collection: 'admins',
    id: '__placeholder__',
    data: {
      isAdmin: true,
      email: 'placeholder@example.com',
      createdAt: serverTimestamp(),
    },
  },
  {
    collection: 'users',
    id: '__placeholder__',
    data: {
      isAdmin: false,
      email: 'placeholder@example.com',
      createdAt: serverTimestamp(),
    },
  },
];

async function run() {
  for (const item of placeholders) {
    const ref = doc(db, item.collection, item.id);
    try {
      await setDoc(ref, item.data, { merge: true });
      console.log(`Created or updated ${item.collection}/${item.id}`);
    } catch (err) {
      console.error(`Failed writing ${item.collection}/${item.id}:`, err);
    }
  }
}

run().then(() => {
  console.log('Done');
}).catch((err) => {
  console.error('Error', err);
  process.exit(1);
});
