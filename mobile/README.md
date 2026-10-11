# Zumik - Mobile App

Application mobile React Native pour Zumik - Partage de musique collaboratif.

## Stack Technique

- **Framework**: React Native 0.81+ avec Expo SDK 54
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation v7
- **State Management**: Zustand v5
- **HTTP Client**: Axios
- **Auth**: Supabase Auth v2.84.0
- **Realtime**: Socket.io-client v4.8.1
- **Validation**: Zod v3.25.76
- **Forms**: React Hook Form v7

## Prérequis

- Node.js 18+
- Backend Zumik running sur `http://localhost:3000`
- Compte Supabase configuré (optionnel pour débuter)
- Expo CLI: `npm install -g expo-cli` (optionnel, `npx` fonctionne)
- SDK Android (Android Studio), ou Xcode sur macOS, pour construire le build de debug

## Installation

```bash
npm install
```

## Configuration

1. Copier `.env.example` vers `.env`
2. Remplir les variables d'environnement avec les valeurs du backend
3. Vérifier que le backend est lancé sur port 3000

### Variables d'environnement

`make dev-docker` et `make dev-local` imposent `EXPO_PUBLIC_API_URL=http://<IP locale>:3000` et `EXPO_PUBLIC_WS_URL=ws://<IP locale>:3000` (variables `DEV_API_URL` et `DEV_WS_URL` de `make/config.mk`), quelle que soit la valeur dans `.env`. `make dev-tunnel` utilise l'URL du tunnel ngrok. Les valeurs de `.env` ne servent que pour un `npx expo start` lancé à la main.

Avec `SUPABASE_MODE=local` (le défaut, voir `backend/README.md`), `make dev-docker`, `make dev-local`, `make expo-android` et `make expo-clear` écrivent aussi `EXPO_PUBLIC_SUPABASE_URL=http://<IP locale>:54421` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` (stack Supabase locale) dans `.env.development.local`, qui l'emporte sur `.env` : Expo le préfère à `.env` pour Metro lancé sur l'hôte, et `make dev-docker` le passe au conteneur mobile en dernier `--env-file` (Expo ne remplace jamais une variable déjà dans l'environnement). `expo-android` et `expo-clear` ne démarrent pas la stack : lancez `make supabase-up` avant si `backend/.env.supabase.local` manque. Avec `SUPABASE_MODE=hosted`, ce sont les valeurs Supabase de `.env` qui servent.

```env
# Backend API (ignoré par make dev-docker, dev-local et dev-tunnel)
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000

# Supabase (ignoré en SUPABASE_MODE=local : make écrit la stack locale)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# SoundCloud (Phase ultérieure)
EXPO_PUBLIC_SOUNDCLOUD_CLIENT_ID=
```

## Démarrage

L'app tourne uniquement en build natif de debug (`com.zumik.app`). Elle ne démarre pas dans Expo Go, à qui manquent ses modules natifs (Google Sign-In, Facebook SDK, couleurs d'image) : ne pas l'utiliser.

### 1. Installer le build de debug (une fois)

```bash
# Android (SDK Android requis) : build et installation sur l'émulateur ou le téléphone USB branché
npx expo run:android --no-bundler   # --device pour choisir l'appareil ; --no-bundler : pas de second Metro sur 8081

# iOS (macOS uniquement)
npx expo run:ios
```

Le build charge ensuite le JS depuis Metro : il suffit de le réinstaller quand le code natif ou les dépendances natives changent. `make open-app` le copie sur les autres émulateurs lancés.

### 2. Lancer Metro

Depuis la racine : `make dev-docker` (Docker), `make dev-local` (émulateur Android Studio) ou `make dev-tunnel` (téléphone sur un autre réseau). Sans make : `npm start` dans `mobile/`.

### 3. Connecter l'app à Metro

`make qr` (ou `make qr-tunnel`) affiche ces étapes avec les bonnes adresses.

- **Émulateur** : automatique, il joint Metro sur `10.0.2.2:8081` ; `make open-app` lance l'app.
- **Téléphone en USB** : `adb reverse tcp:8081 tcp:8081`, puis ouvrir Zumik.
- **Téléphone sur le même WiFi** : secouer le téléphone, menu de dev › **Change Bundle Location** › `<HOST_IP>:8081` (adresse donnée par `make info`).
- **Téléphone sur un autre réseau** (`make dev-tunnel`) : même menu, saisir l'hôte du tunnel Expo affiché par `make qr-tunnel` (`xxxx-8081.exp.direct:80`).

« Unable to load script » : l'app ne joint pas Metro. Vérifier que Metro tourne et l'adresse saisie, puis toucher **RELOAD**.

## Scripts Disponibles

### Démarrage Expo

- `npm start` - Mode normal (défaut)
- `npm run start:lan` - Mode LAN (téléphone sur le même WiFi)
- `npm run start:tunnel` - Mode tunnel (fonctionne avec WiFi différents)
- `npm run start:clear` - Démarrer avec cache effacé
- `npm run start:lan-clear` - Mode LAN + cache effacé
- `npm run android` - Build de debug et lancement sur émulateur/appareil Android (`expo run:android`)
- `npm run ios` - Build de debug et lancement sur simulateur iOS (macOS uniquement)
- `npm run web` - Lancer dans le navigateur

### Qualité de Code

- `npm run check` - Vérifier types TypeScript + ESLint (rapide)
- `npm run fix` - Formater et corriger automatiquement tout
- `npm run check-all` - Vérification complète (types + lint + format)
- `npm run lint` - Linter le code
- `npm run lint:fix` - Corriger les erreurs ESLint
- `npm run format` - Formater avec Prettier
- `npm run type-check` - Vérifier les types TypeScript uniquement

### Maintenance & Diagnostic

- `npm run clean:cache` - Nettoyer le cache Expo (rapide, ~5 secondes)
- `npm run clean:full` - Nettoyage complet + réinstallation
- `npm run clean` - Nettoyer et réinstaller (alias de clean:full)
- `npm run reset` - Nettoyer le cache et redémarrer Expo
- `npm run doctor` - Diagnostiquer les problèmes de configuration Expo
- `npm run update` - Vérifier si les dépendances sont à jour

### Build & Production

- `npm run prebuild` - Générer les dossiers natifs Android/iOS
- `npm run build:local` - Build Android local (nécessite Android Studio)

### Backend

- `npm run dev:backend` - Lancer le backend depuis le dossier mobile

## Commandes les Plus Utiles

Pour débuter, voici les 5 commandes que vous utiliserez le plus :

1. **`npm run android`** - Installer le build de debug (il lance aussi son propre Metro : l'arrêter, ou utiliser `npx expo run:android --no-bundler`), puis `make dev-docker` pour Metro
2. **`npm run fix`** - Corriger automatiquement le code
3. **`npm run check`** - Vérifier avant un commit
4. **`npm run reset`** - Résoudre les bugs étranges
5. **`npm run doctor`** - Diagnostiquer les problèmes

## Architecture

```
mobile/src/
├── screens/            # Écrans par feature
│   ├── auth/           # Welcome, Login, Register, EmailVerification, ForgotPassword, ResetPassword
│   ├── playlists/      # Playlists, PlaylistDetail, CreatePlaylist, SearchTracks, PlaylistSharing
│   ├── friends/        # Friends, UserProfile
│   ├── profile/        # Profile, EditProfile, PrivacySettings, MusicPreferences
│   ├── search/         # SoundCloudSearch (+ components/)
│   └── settings/       # Settings
├── components/
│   ├── common/         # Button, Card, Input, Avatar, SearchBar, ErrorBoundary, items swipeables...
│   ├── playlist/       # TrackItem, PlaylistCard, PlaylistGridCard, PlaylistHeader, AddTrackButton...
│   ├── player/         # MiniPlayer, PlayerModal, PlayerErrorToast
│   ├── profile/        # GenreSelector, VisibilityToggle, NowPlayingInline...
│   ├── music-control/  # DeviceListeningCard
│   └── theme/          # ThemeSelector
├── navigation/         # RootNavigator, AuthNavigator, AppNavigator (onglets) + stacks/
├── store/              # Zustand : authStore, playlistStore, playerStore, socketStore, soundcloudStore
├── contexts/           # ThemeContext, PlayerContext
├── hooks/              # useMusicControl, usePlaylistSocket, usePlayerSync, usePlayerProgress, useImageColors
├── api/                # playlistApi.ts
├── services/           # api.ts (client HTTP de base), profileApi, friendsApi, musicControlApi, privacyApi, oauth, deviceService
├── lib/                # supabase.ts
├── themes/             # Thèmes (original, royalBlue, pastelLime, christmas) + tokens
├── types/              # Types alignés sur les réponses du backend
├── utils/              # validators (Zod), formatters, toast
├── constants/          # Config API, constantes
└── config/             # toastConfig
```

## Navigation

- **RootNavigator** bascule entre `AuthNavigator` et `AppNavigator` selon l'état d'auth (persisté par `authStore`).
- **AuthNavigator** : Welcome, Login, Register, EmailVerification, ForgotPassword, ResetPassword.
- **AppNavigator** (onglets) :
  - Playlists → Playlists, PlaylistDetail, CreatePlaylist, SearchTracks, PlaylistSharing
  - Search → Search
  - Friends → Friends, UserProfile, PlaylistDetail, SearchTracks
  - Profile → Profile, EditProfile, PrivacySettings, MusicPreferences, Settings

## État, temps réel et lecture

- **Appels HTTP** : toujours via `services/api.ts`, qui ajoute le token et les headers `X-Platform`, `X-Device-Model`, `X-App-Version` logués par le backend.
- **Temps réel** : `socketStore` gère la connexion Socket.io ; `usePlaylistSocket` rejoint la room d'une playlist et réagit à `playlist:updated` ; `useMusicControl` gère l'écoute des amis et les commandes de contrôle délégué.
- **Lecture audio** : expo-audio lit le stream HLS SoundCloud ; `PlayerContext` gère le cycle de vie du lecteur, `playerStore` l'état (track courante, play/pause, modal), `MiniPlayer` et `PlayerModal` l'affichage.
- **OAuth** : `services/oauth.ts` (Google Sign-In, Facebook SDK). Le token obtenu est vérifié par le backend (`/api/auth/google`, `/api/auth/facebook`). Modules natifs : comme le reste de l'app, il faut le build de debug, pas Expo Go.
- **Signature Android** : `plugins/withDebugKeystore.js` remplace pendant `expo prebuild` le keystore de debug du template Expo (partagé par toutes les apps Expo) par `keystores/debug.keystore`. Son SHA-1 `5D:26:8F:52:F7:A8:2D:71:3A:D9:68:BF:60:6A:79:BB:85:AA:71:C0` est celui à enregistrer, avec le package `com.zumik.app`, dans le client OAuth Android du projet Google Cloud qui contient `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. Sinon Google Sign-In renvoie `DEVELOPER_ERROR`.

## Développement

### Path Aliases

Le projet utilise des alias de chemin pour des imports propres :

```typescript
// Au lieu de
import { Button } from '../../../components/common/Button';

// Utiliser
import { Button } from '@components/common/Button';
```

Alias disponibles (voir `tsconfig.json`) : `@/*`, `@api`, `@components`, `@screens`, `@services`, `@store`, `@hooks`, `@utils`, `@constants`, `@contexts`, `@themes`

### Thème

Plusieurs thèmes sont disponibles dans `src/themes/` (original, royalBlue, pastelLime, christmas), sélectionnables via `ThemeSelector`. Les tokens communs sont dans `src/themes/tokens.ts`.

### Hot Reload

Expo supporte le Hot Reload : modifiez n'importe quel fichier et l'app se met à jour automatiquement en 1-2 secondes.

## Alignement Backend

Les types, validateurs et versions sont alignés avec le backend :

- **Types TypeScript** (`src/types/`) correspondent aux schémas backend
- **Validateurs Zod** (`src/utils/validators.ts`) utilisent les mêmes règles
- **Versions** : Supabase, Socket.io, Zod identiques au backend

## Tests

À venir dans une phase ultérieure.

## Documentation

- [Documentation complète du projet](../README.md)
- [Documentation backend](../backend/README.md)
- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)

## Prochaines Étapes

Le reste à faire est suivi dans les GitHub Issues du repo (epics et stories BMAD).

## Support

En cas de problème :

1. Lire le message d'erreur complet
2. Vérifier que le backend est lancé (localhost:3000)
3. Vérifier les variables d'environnement (.env)
4. Consulter la documentation Expo

## License

MIT
