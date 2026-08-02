#!/usr/bin/env node
/**
 * CommonJS wrapper of set-firebase-admin.js so it runs when package.json uses
 * "type": "module". Usage is identical to the original script.
 */
const path = require('path');
const fs = require('fs');

async function run() {
  const serviceAccountPath = process.argv[2];
  const identifier = process.argv[3];

  if (!serviceAccountPath || !identifier) {
    console.error('Usage: node scripts/set-firebase-admin.cjs <serviceAccount.json> <email|uid>');
    process.exit(1);
  }

  const absPath = path.resolve(serviceAccountPath);
  if (!fs.existsSync(absPath)) {
    console.error('Service account file not found at', absPath);
    process.exit(1);
  }

  const admin = require('firebase-admin');
  const serviceAccount = require(absPath);

  // firebase-admin versions export either `admin.credential.cert` or a top-level `admin.cert`.
  const credential = (admin.credential && typeof admin.credential.cert === 'function')
    ? admin.credential.cert(serviceAccount)
    : (typeof admin.cert === 'function' ? admin.cert(serviceAccount) : undefined);

  if (!credential) {
    console.error('Unable to obtain a credential from firebase-admin (admin.credential.cert or admin.cert).');
    process.exit(1);
  }

  admin.initializeApp({ credential });

  try {
    const { getAuth } = require('firebase-admin/auth');
    const { getFirestore, FieldValue } = require('firebase-admin/firestore');

    const auth = getAuth();
    const db = getFirestore();

    let uid = identifier;
    let userRecord = null;
    if (identifier.includes('@')) {
      userRecord = await auth.getUserByEmail(identifier);
      uid = userRecord.uid;
      console.log('Resolved email to uid:', uid);
    }

    // Set custom claim
    await auth.setCustomUserClaims(uid, { admin: true });
    console.log('Custom claim set: admin=true for', uid);

    // Set Firestore docs
    const now = FieldValue.serverTimestamp();
    const adminData = { isAdmin: true, updatedAt: now };
    if (userRecord && userRecord.email) {
      adminData.email = userRecord.email;
    }

    await db.collection('admins').doc(uid).set(adminData, { merge: true });
    await db.collection('users').doc(uid).set(adminData, { merge: true });
    if (userRecord && userRecord.email) {
      const emailKey = userRecord.email.toLowerCase();
      await db.collection('admins').doc(emailKey).set(adminData, { merge: true });
      await db.collection('users').doc(emailKey).set(adminData, { merge: true });
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
