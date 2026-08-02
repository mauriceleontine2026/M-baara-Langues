#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/set-firebase-admin.js <path/to/serviceAccountKey.json> <email|uid>
 *
 * This script sets a custom claim `admin: true` on the user and creates
 * Firestore documents `admins/{uid}` and `users/{uid}` with `isAdmin: true`.
 *
 * Requirements:
 *   npm i firebase-admin
 */

const path = require('path');
const fs = require('fs');

async function run() {
  const serviceAccountPath = process.argv[2];
  const identifier = process.argv[3];

  if (!serviceAccountPath || !identifier) {
    console.error('Usage: node scripts/set-firebase-admin.js <serviceAccount.json> <email|uid>');
    process.exit(1);
  }

  const absPath = path.resolve(serviceAccountPath);
  if (!fs.existsSync(absPath)) {
    console.error('Service account file not found at', absPath);
    process.exit(1);
  }

  const admin = require('firebase-admin');
  const serviceAccount = require(absPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  try {
    let uid = identifier;
    if (identifier.includes('@')) {
      const userRecord = await admin.auth().getUserByEmail(identifier);
      uid = userRecord.uid;
      console.log('Resolved email to uid:', uid);
    }

    // Set custom claim
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log('Custom claim set: admin=true for', uid);

    // Set Firestore docs
    const db = admin.firestore();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const adminData = { isAdmin: true, updatedAt: now };
    if (userRecord.email) {
      adminData.email = userRecord.email;
    }

    await db.collection('admins').doc(uid).set(adminData, { merge: true });
    await db.collection('users').doc(uid).set(adminData, { merge: true });
    if (userRecord.email) {
      await db.collection('admins').doc(userRecord.email.toLowerCase()).set(adminData, { merge: true });
      await db.collection('users').doc(userRecord.email.toLowerCase()).set(adminData, { merge: true });
      console.log('Firestore documents updated: admins/{uid}, users/{uid}, admins/{email}, users/{email}');
    } else {
      console.log('Firestore documents updated: admins/{uid} and users/{uid}');
    }

    console.log('Done — user should reauthenticate to pick up custom claims.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
