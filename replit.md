# Deploy on Replit

This repository is configured to run the backend on Replit.

## What is already set up

- `.replit` uses `bash` and runs `bash start.sh`.
- `start.sh` changes into `backend/`, installs `backend/requirements.txt`, and starts Uvicorn.
- `replit.nix` installs:
  - `python310`
  - `python310Packages.pip`
  - `bash`
  - `ffmpeg`

## Replit deploy steps

1. Create a new Repl on Replit.
2. Choose "Import from GitHub" and use this repository:
   `https://github.com/mauriceleontine2026/M-baara-Langues`
3. Open the Repl and confirm the files exist in the root:
   - `.replit`
   - `replit.nix`
   - `start.sh`
   - `backend/requirements.txt`
4. In Replit, make sure you are signed in and have access to the project.
   If you see a `404` or a login page, sign in to the account that owns the repo.
5. Set the required environment variables in the Replit Secrets / Environment panel:

```text
DATABASE_URL=sqlite:///./mbaara.db
JWT_SECRET=<your_jwt_secret>
JWT_ALGORITHM=HS256
OPENAI_API_KEY=<your_openai_api_key>
```

6. Start the Repl. Replit should run `bash start.sh` and use `uvicorn`.
7. Verify the backend is available at:
   - `https://<your-repl-subdomain>.replit.app/api/health`

## Notes

- The backend uses `backend/requirements.txt` for dependencies.
- The Replit run command is explicit and should avoid automatic detection issues.
- If the app does not start, open the Replit console and inspect the startup logs.

## Frontend integration

If you want the frontend to use the Replit-hosted backend, set `VITE_API_BASE_URL` to the public Replit URL in `.env.local` or your frontend deployment environment.
