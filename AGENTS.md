# AGENTS.md

## Project Context

This repository is a custom M'Baara frontend app that now talks to a custom backend.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Key Files

- `src/`: frontend application source.
- `vite.config.js`: Vite config for the React + Vite app.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `npm run dev` to run the frontend locally.
- Use the custom backend API endpoints exposed by `src/api/*` and backend router handlers.
- Run the relevant checks from `package.json` before finishing code changes.
