# Mobile Setup (Expo React Native)

## Prérequis
- Node.js 18+
- npm
- Expo CLI (optionnel) : `npm install -g expo-cli`

## Installation

```bash
cd mobile
npm install
```

## Copie des assets

```powershell
cd ..
powershell -File mobile/scripts/copy_assets.ps1
```

## Lancer l'application

```bash
cd mobile
npm run start
```

## API Backend

L'API backend doit être disponible sur `http://127.0.0.1:8000/api`.

- Si vous utilisez un émulateur Android, remplacez `localhost` par `10.0.2.2` dans `mobile/src/services/api.ts`.

## Audio

- `expo-speech` est installé pour la synthèse vocale mobile.
- `AudioScreen` propose un enregistrement audio local et un upload au backend pour transcription.

## Auth

- Les écrans `LoginScreen` et `RegisterScreen` stockent le token JWT dans `AsyncStorage`.
- Les requêtes API utilisent le token automatiquement.
