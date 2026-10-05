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

## Installation

```bash
npm install
```

## Configuration

1. Copier `.env.example` vers `.env`
2. Remplir les variables d'environnement avec les valeurs du backend
3. Vérifier que le backend est lancé sur port 3000

### Variables d'environnement

```env
# Backend API
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000

# Supabase (optionnel pour débuter)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# SoundCloud (Phase ultérieure)
EXPO_PUBLIC_SOUNDCLOUD_CLIENT_ID=
```

## Démarrage

### Développement avec Expo Go

1. Installer Expo Go sur votre téléphone Android/iOS
2. Lancer le serveur :

```bash
npm start
```

3. Scanner le QR code avec Expo Go

### Développement sur émulateur

```bash
# Android
npm run android

# iOS (macOS uniquement)
npm run ios
```

## Scripts Disponibles

### Démarrage Expo

- `npm start` - Mode normal (défaut)
- `npm run start:lan` - Mode LAN (recommandé avec Expo Go sur même WiFi)
- `npm run start:tunnel` - Mode tunnel (fonctionne avec WiFi différents)
- `npm run start:clear` - Démarrer avec cache effacé
- `npm run start:lan-clear` - Mode LAN + cache effacé
- `npm run android` - Lancer sur émulateur/appareil Android
- `npm run ios` - Lancer sur simulateur iOS (macOS uniquement)
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

1. **`npm run start:lan`** - Tester avec Expo Go (recommandé)
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
- **OAuth** : `services/oauth.ts` (Google Sign-In, Facebook SDK). Le token obtenu est vérifié par le backend (`/api/auth/google`, `/api/auth/facebook`). Ne fonctionne pas dans Expo Go : il faut un development build.

## Développement

### Path Aliases

Le projet utilise des alias de chemin pour des imports propres :

```typescript
// Au lieu de
import { Button } from '../../../components/common/Button';

// Utiliser
import { Button } from '@components/common/Button';
```

Alias disponibles (voir `tsconfig.json`) : `@/*`, `@api`, `@components`, `@screens`, `@services`, `@store`, `@hooks`, `@utils`, `@types`, `@constants`, `@contexts`, `@themes`

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
