# M'Baara Project

Use this repository to run and edit the app locally and connect it to the custom backend.

## Prerequisites

1. Clone the repository using the project's Git URL.
2. Navigate to the project directory.
3. Install dependencies: `npm install`.

## Run Locally

Start the backend and the frontend from the project root:

```bash
npm run dev:backend
npm run dev:web
```

Open the local URL printed by Vite.

### Expose the backend publicly for hosted frontend testing

To expose the local backend through a public tunnel, run:

```bash
npm run dev:tunnel
```

Copy the public URL shown by `localtunnel`, then set `VITE_API_BASE_URL` in `.env.local` (for local development) or `.env.production` (for a hosted frontend build) to that URL.

If the tunnel is restarted, update the URL again before rebuilding or redeploying the frontend.

> Do not leave a stale tunnel URL in production; the hosted frontend must point to a live backend endpoint.

### Deploy the backend with Docker

A production-ready backend can be deployed using Docker. The repo includes `backend/Dockerfile` and `backend/docker-compose.deploy.yml`.

From the project root:

```bash
cd backend
docker build -t mbaara-backend .
docker run -p 8000:8000 \
  -e DATABASE_URL="sqlite:///./mbaara.db" \
  -e JWT_SECRET="change-this-secret" \
  -e JWT_ALGORITHM="HS256" \
  -v "$PWD/mbaara.db:/app/mbaara.db" \
  mbaara-backend
```

Or use the deploy compose file:

```bash
docker compose -f backend/docker-compose.deploy.yml up --build
```

After deployment, point `VITE_API_BASE_URL` to the public backend URL and rebuild/redeploy the frontend.

## Use The Hosted Backend

For frontend-only development, create or update `.env.local` in the project root with your backend and Firebase values as needed.

## Native Android / iOS with Capacitor

This repository now includes a Capacitor native wrapper in `android/` and `ios/`.

To enable Firebase for both web and mobile builds, add the following variables to `.env.local`:

```bash
VITE_USE_FIREBASE=true
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

Place your native Firebase config files in the native projects if you want to use the native Android/iOS tooling as well:

- `android/app/google-services.json`
- `ios/App/App/GoogleService-Info.plist`

Use `.env.local.example` as a template and fill the Firebase web SDK values before running the app.

Then build the web assets and sync Capacitor:

```bash
npm run build
npx cap sync android
npx cap sync ios
```

Open the native projects for platform-specific tooling:

```bash
npx cap open android
npx cap open ios
```

The Capacitor web view will load the built app and the Firebase JS SDK will use the `VITE_FIREBASE_*` values at runtime.

## Publish Your Changes

After pushing your changes to git, open your source repository hosting dashboard or deployment platform to continue the release process.

## Docs & Support

Use your project-specific documentation and support channels for deployment guidance.
