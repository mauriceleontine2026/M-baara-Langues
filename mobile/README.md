Mobile (Expo) — instructions de développement

Pré-requis:
- Node.js >= 18
- Expo CLI (optionnel) : `npm install -g expo-cli`
- Copier les assets du projet web vers `mobile/assets` (script inclus)

Installer et lancer l'app en mode développement:

```bash
cd mobile
npm install
npm run start
# ou
expo start
```

Connexion au backend local (FastAPI):
- L'API est attendue sur `http://127.0.0.1:8000/api`.
- Si vous testez sur un émulateur Android, remplacez `127.0.0.1` par `10.0.2.2`.

Copier les assets depuis le repo racine (`logo/` et `public/`) vers `mobile/assets`:

```powershell
# depuis la racine du projet
powershell -File mobile/scripts/copy_assets.ps1
```

Notes:
- UI: recréer les composants RN en respectant la librairie UI web dans `src/components/ui`.
- Auth: utiliser les endpoints `POST /api/auth/register` et `POST /api/auth/login` pour récupérer le JWT.
- STT/TTS: le backend utilisera `faster-whisper` pour la reconnaissance vocale locale et `gTTS` ou `expo-speech` pour la synthèse.
