Deployment instructions

This repository contains GitHub Actions workflows to deploy to Vercel, Firebase Hosting, and GitHub Pages.

Required repository secrets (GitHub → Settings → Secrets → Actions):

- Vercel
  - VERCEL_TOKEN — personal token from Vercel
  - VERCEL_ORG_ID — organization id (from Vercel project settings)
  - VERCEL_PROJECT_ID — project id (from Vercel project settings)

- Firebase
  - FIREBASE_TOKEN — generated with `firebase login:ci` or a service account CI token
  - FIREBASE_PROJECT_ID — your Firebase project id

- GitHub Pages
  - Uses `GITHUB_TOKEN` automatically (no manual secret required)

How to generate tokens

- Vercel
  1. Go to https://vercel.com/account/tokens
  2. Create a new Personal Token and copy it.
  3. In your repo settings, add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`.

- Firebase
  1. Install Firebase CLI locally: `npm i -g firebase-tools`
  2. Run: `firebase login:ci` and copy the printed token.
  3. Add that token as `FIREBASE_TOKEN` and set `FIREBASE_PROJECT_ID`.

Triggering deployments

- Push to `main` branch will run all three workflows and deploy to Vercel, Firebase Hosting, and GitHub Pages.

Notes & next optimization steps

- I added `manualChunks` to `vite.config.js` to split `localLanguageDataLazy`, `Lesson`, `Learn`, and `Exercise` into separate chunks. You may further tune these chunk names or split additional heavy pages.
- Consider replacing `import.meta.glob(..., { as: 'raw' })` with the `query: '?raw'` form for future compatibility.
- If you want, I can open a PR with further chunk tuning or adjust the workflows (e.g., deploy only to selected targets).
