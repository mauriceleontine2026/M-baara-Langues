# Scripts for managing Firebase admin role

This folder contains a helper to set a Firebase admin claim and Firestore admin docs.

Usage:

1. Install dependency:

```bash
npm install firebase-admin
```

2. Run the script with your service account JSON and the target user (email or uid):

```bash
node scripts/set-firebase-admin.js path/to/serviceAccountKey.json user@example.com
```

What it does:
- Sets custom claim `admin: true` on the user (so `getIdTokenResult(...).claims.admin` will be true).
- Creates/merges `admins/{uid}` and `users/{uid}` documents with `isAdmin: true` in Firestore.

After running, the user should sign out/sign in so the client picks up the new claim.
