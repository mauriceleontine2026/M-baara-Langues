const firebase = require('firebase/compat/app');
require('firebase/compat/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyDJv9HiIhR_qTlmAX_SUX8Fn6ogTeE8NBc',
  authDomain: 'm-baara-langues.firebaseapp.com',
  projectId: 'm-baara-langues',
  storageBucket: 'm-baara-langues.firebasestorage.app',
  messagingSenderId: '880565684611',
  appId: '1:880565684611:web:8c817cd0576236c826ceb6',
  measurementId: 'G-LBNCY8C8QD',
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;

const placeholders = [
  {
    collection: 'languages',
    id: 'example-language',
    data: {
      name: 'Placeholder language',
      code: 'xx',
      active: false,
      createdAt: serverTimestamp(),
    },
  },
  {
    collection: 'vocabulary',
    id: 'example-vocabulary',
    data: {
      language_code: 'xx',
      word: 'placeholder',
      translation: 'placeholder',
      createdAt: serverTimestamp(),
    },
  },
  {
    collection: 'lessons',
    id: 'example-lesson',
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
    id: 'example-admin',
    data: {
      isAdmin: true,
      email: 'placeholder@example.com',
      createdAt: serverTimestamp(),
    },
  },
  {
    collection: 'users',
    id: 'example-user',
    data: {
      isAdmin: false,
      email: 'placeholder@example.com',
      createdAt: serverTimestamp(),
    },
  },
];

async function run() {
  for (const item of placeholders) {
    try {
      await db.collection(item.collection).doc(item.id).set(item.data, { merge: true });
      console.log(`Created or updated ${item.collection}/${item.id}`);
    } catch (err) {
      console.error(`Failed writing ${item.collection}/${item.id}:`, err.message || err);
    }
  }
}

run().then(() => {
  console.log('Done');
  process.exit(0);
}).catch((err) => {
  console.error('Error', err);
  process.exit(1);
});
