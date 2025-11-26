# Music Room - Mobile App

Application mobile React Native pour Music Room - Partage de musique collaboratif.

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
- Backend Music Room running sur `http://localhost:3000`
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

# Spotify (Phase ultérieure)
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=
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
mobile/
├── src/
│   ├── screens/          # Écrans par feature
│   │   ├── auth/         # Login, Register
│   │   ├── friends/      # Liste amis, invitations
│   │   ├── playlists/    # Playlists collaboratives
│   │   ├── devices/      # Gestion devices
│   │   └── spotify/      # Connexion Spotify
│   ├── components/       # Composants réutilisables
│   │   ├── common/       # Button, Card, Input...
│   │   ├── playlist/     # TrackItem, PlaylistCard...
│   │   ├── player/       # PlayerControls, ProgressBar...
│   │   └── friends/      # FriendItem, InviteButton...
│   ├── navigation/       # Configuration navigation
│   ├── services/         # API clients
│   │   ├── api.ts        # Axios config
│   │   ├── auth.service.ts
│   │   ├── playlist.service.ts
│   │   └── socket.service.ts
│   ├── store/            # Zustand stores
│   │   ├── authStore.ts
│   │   ├── playlistStore.ts
│   │   └── playerStore.ts
│   ├── hooks/            # Custom hooks
│   ├── types/            # TypeScript types
│   ├── constants/        # Constantes (colors, API URLs)
│   └── utils/            # Fonctions utilitaires
└── assets/               # Images, fonts, icons
```

## Développement

### Path Aliases

Le projet utilise des alias de chemin pour des imports propres :

```typescript
// Au lieu de
import { Button } from '../../../components/common/Button';

// Utiliser
import { Button } from '@components/common/Button';
```

Alias disponibles : `@components`, `@screens`, `@services`, `@store`, `@hooks`, `@utils`, `@types`, `@constants`

### Thème

Le projet utilise un thème dark inspiré de Spotify :

- **Primary**: #1DB954 (Spotify Green)
- **Background**: #121212 (Pure Black)
- **Surface**: #282828 (Dark Gray)
- **Text**: #FFFFFF (White)

Voir `src/constants/index.ts` pour tous les tokens de design.

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

- [Plan complet du projet](../PLAN.md)
- [Documentation backend](../backend/README.md)
- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)

## Prochaines Étapes

1. Configuration Supabase Client
2. Configuration Socket.io Client (temps réel)
3. Navigation (Auth Stack + App Stack)
4. Zustand Stores (auth, playlists, playback)
5. Écrans Auth (Login, Register)
6. Services API & WebSocket

## Support

En cas de problème :

1. Lire le message d'erreur complet
2. Vérifier que le backend est lancé (localhost:3000)
3. Vérifier les variables d'environnement (.env)
4. Consulter la documentation Expo

## License

MIT
