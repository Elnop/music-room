# Zumik - Mobile App

Application mobile React Native pour Zumik - Partage de musique collaboratif.

## Stack Technique

- **Framework**: React Native 0.81+ avec Expo SDK 54
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation v7
- **State Management**: TanStack Query v5 (données serveur, cache, invalidation) et Zustand v5 (état client local : session, préférences, UI, lecteur)
- **HTTP Client**: Client API partagé (`src/shared/services/api.ts`) basé sur `fetch` avec injection automatique des en-têtes de télémétrie (`X-Platform`, `X-Device-Model`, `X-App-Version`) et rafraîchissement transparent de token
- **Auth**: API du backend (`/api/auth/*`) ; l'app n'embarque aucun client Supabase
- **Realtime**: Socket.io-client v4.8.1
- **Validation**: Zod v3.25.76
- **Forms**: React Hook Form v7

## Prérequis

- Node.js 18+
- Backend Zumik running sur `http://localhost:3000`
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

L'app ne parle jamais à Supabase : connexion, inscription, vérification d'e-mail, réinitialisation du mot de passe, rafraîchissement et déconnexion passent par l'API du backend (appels de `src/features/auth/services/`, via le client `src/shared/services/api.ts`), qui les journalise. La session (tokens du backend) vit dans `src/features/auth/stores/authStore.ts`, persistée dans AsyncStorage par `features/auth/services/sessionStorage.ts` ; elle est rafraîchie par `/api/auth/refresh` (avant une requête si le token expire bientôt, au démarrage, et après un 401), et un refresh refusé (401) ramène à l'écran de connexion en vidant le stockage.

```env
# Backend API (ignoré par make dev-docker, dev-local et dev-tunnel)
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000

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

- `npm run check` - Tous les garde-fous en parallèle (types, lint, code mort, dépendances, duplication, motifs, secrets, tests), lancé aussi en pre-commit : voir `.agents/rules/guardrails.md`
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

L'APK de production (backend `https://zumik.cluzhub.com`) est construit par `.github/workflows/release-apk.yml` à chaque push sur `main` et publié dans les [GitHub Releases](https://github.com/Elnop/music-room/releases/latest). Il lit `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_FACEBOOK_APP_ID` et `EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN` dans les secrets Actions du repo. Lancé à la main (`gh workflow run release-apk.yml --ref <branche>`) hors de `main`, il dépose l'APK en artefact du run sans créer de release.

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

Issue de l'epic #362 : `src/shared/`, `src/providers/`, `src/navigation/` et `src/features/<feature>/`. Toutes les features ont été entièrement migrées (#378–#385) selon le pattern orchestrators / presenters / hooks, et l'ensemble des règles de composants est garanti par le plugin ESLint sans aucune exception. Chaque feature a une seule arborescence : ce que ses sujets partagent (`hooks/`, `services/`, `stores/`, `utils/`, `types.ts`…) à sa racine, ses providers React dans `context/`, et un dossier par sujet, même s'il n'y en a qu'un, qui contient `components/orchestrators/`, `components/presenters/` et `hooks/`.

```
mobile/src/
├── shared/                 # Code commun à toutes les features ; n'importe ni features/ ni navigation/
│   ├── components/
│   │   ├── ui/             # Primitives : Pressable, Button, Input, Card, Skeleton, ThemedSwitch, LoadingSpinner
│   │   ├── feedback/       # AppToast, ConnectionBanner, EmptyState, ErrorBoundary, FormError
│   │   ├── form/           # SearchBar, BackendUrlField
│   │   ├── lists/          # ReorderableList, SwipeableTrackItem, SwipeableUserItem, QueueSwipe
│   │   ├── media/          # Artwork, Avatar
│   │   ├── sharing/        # ShareLinkButton
│   │   └── theme/          # ThemeSelector, ThemedSystemUI
│   ├── services/           # api.ts (client HTTP), authSession (contrat de session), playbackBridge
│   │                       # (contrat de lecture), backendUrl, lastTrackStorage
│   ├── query/              # TanStack Query : queryClient (profils STALE), keys (fabrique de clés), socketCache
│   ├── stores/             # socketStore (connexion Socket.io)
│   ├── hooks/              # useConnectionStatus, useImageColors
│   ├── theme/              # ThemeContext, thèmes (original, royalBlue, pastelLime, christmas), tokens
│   ├── constants/app.ts    # Config API, espacements
│   └── utils/              # logger, toast, haptics, apiErrorMessage, debounce, moveTarget, shareLinks...
├── providers/              # AppProviders : gestes, ErrorBoundary, QueryClient, thème, safe area
├── navigation/             # RootNavigator, AuthNavigator, AppNavigator (onglets) + stacks/
├── features/               # Une feature par dossier (#378–#385)
│   ├── auth/               # Connexion, inscription, code e-mail, mot de passe oublié, comptes liés
│   │   ├── <sujet>/        # welcome, login, register, emailVerification, forgotPassword, resetPassword,
│   │   │                   # code, form, social : components/{orchestrators,presenters} + hooks/
│   │   ├── hooks/          # Requêtes et mutations TanStack (comptes liés, connexion, mot de passe)
│   │   ├── services/       # authApi, passwordApi, providersApi, signIn, googleSignIn, facebookSignIn, sessionStorage
│   │   ├── stores/         # authStore (session) et ses actions
│   │   ├── utils/          # codeDigits, passwordRules
│   │   └── types.ts · validators.ts
│   ├── playlists/          # Listes, détail, création/édition, ajout de titres, visibilité et droits
│   │   ├── <sujet>/        # list, detail, form, searchTracks, sharing, trackActions, actionSheet, header
│   │   ├── hooks/          # Requêtes et mutations TanStack, room Socket.io (usePlaylistRoom)
│   │   ├── services/       # playlistApi, tracksApi, membersApi, usersApi, trackSearchApi
│   │   ├── stores/         # pendingMovesStore (déplacements en cours)
│   │   ├── utils/          # Cache (playlistCache, trackEdits, trackMoves), playlistSync, règles socket, droits
│   │   └── types.ts · validators.ts
│   ├── queue/              # File d'attente locale/room, synchronisation et Connect (#381)
│   │   ├── queueModal/     # components/{orchestrators,presenters} + hooks/
│   │   ├── devicePicker/   # components/{orchestrators,presenters} + hooks/
│   │   ├── hooks/          # useQueueSync, useRemoteTarget
│   │   ├── services/       # transferPlayback
│   │   ├── stores/         # queueStore, connectStore
│   │   └── types.ts
│   ├── friends/            # Liste d'amis, recherche d'utilisateurs, profil ami et permissions (#382)
│   │   ├── friendsList/    # components/{orchestrators,presenters} + hooks/
│   │   ├── userProfile/    # components/{orchestrators,presenters} + hooks/
│   │   ├── hooks/          # useFriendsQueries, useFriendsMutations
│   │   ├── services/       # friendsApi
│   │   └── types.ts
│   ├── music-control/      # Contrôle délégué, gestion des appareils, permissions d'écoute (#384)
│   │   ├── myDevices/      # components/{orchestrators,presenters} + hooks/ + utils/
│   │   ├── hooks/          # useMusicControl, useFriendListening, useControllableDevices...
│   │   ├── services/       # musicControlApi
│   │   └── types.ts
│   └── search/             # Recherche de titres SoundCloud (#385)
│       ├── searchScreen/   # components/{orchestrators,presenters} + hooks/
│       ├── hooks/          # useSoundCloudSearch (TanStack Query)
│       ├── services/       # searchApi
│       └── types.ts
│
│   Dossiers historiques, vidés par les stories de migration :
├── services/               # Clients d'API testés (api-clients.test.ts)
└── types/                  # Types alignés sur les réponses du backend
```

## Navigation

- **RootNavigator** bascule entre `AuthNavigator` et `AppNavigator` selon l'état d'auth (persisté par `features/auth/stores/authStore.ts`).
- **AuthNavigator** : Welcome, Login, Register, EmailVerification, ForgotPassword, ResetPassword ; chaque écran est l'orchestrator de `features/auth/<sujet>/`.
- **AppNavigator** (onglets) :
  - Playlists → Playlists, PlaylistDetail, CreatePlaylist, SearchTracks, PlaylistSharing (les orchestrators de `features/playlists/<sujet>/`)
  - Search → Search (l'orchestrator de `features/search/searchScreen/components/orchestrators`)
  - Friends → Friends, UserProfile, PlaylistDetail, SearchTracks
  - Profile → Profile, EditProfile, PrivacySettings, MusicPreferences, LinkedAccounts, MyDevices, Settings (les orchestrators de `features/profile/<sujet>/` et `features/music-control/myDevices/components/orchestrators`)

## État, temps réel et lecture

- **Appels HTTP** : toujours via `shared/services/api.ts`, qui ajoute le token et les headers `X-Platform`, `X-Device-Model`, `X-App-Version` logués par le backend.
- **Données serveur** : TanStack Query (`AppProviders` fournit le client). Une clé de requête se construit avec `queryKeys` (`shared/query/keys.ts`), la fraîcheur se choisit parmi les profils `STALE` (`shared/query/queryClient.ts`), et un événement Socket.io met le cache à jour (`setQueryData`) ou l'invalide via `useSocketCache` (`shared/query/socketCache.ts`). Zustand ne garde que l'état client. Règles : `.agents/rules/state.md`.
- **Session et couche partagée** : `shared/` n'importe pas l'auth ; le store de session s'enregistre dans `shared/services/authSession.ts` (token, refresh) et y annonce chaque fin de session (`onSessionEnd`), sur laquelle le socket se ferme et le lecteur se vide.
- **Temps réel** : `shared/stores/socketStore.ts` gère la connexion Socket.io ; `features/playlists/hooks/usePlaylistRoom.ts` rejoint la room d'une playlist, dont les événements mettent le cache à jour (`utils/playlistSocketRules.ts`) ; `useMusicControl` gère l'écoute des amis et les commandes de contrôle délégué.
- **Contrat de lecture** : les playlists lancent et affichent la lecture via `shared/services/playbackBridge.ts`, que `navigation/playbackBridge.ts` branche sur `playerStore` et `queueStore` au chargement d'`AppNavigator` ; aucune feature n'importe le lecteur ni la file.
- **Lecture audio** : expo-audio lit le stream HLS SoundCloud ; `PlayerContext` gère le cycle de vie du lecteur, `playerStore` l'état (track courante, play/pause, modal), `MiniPlayer` et `PlayerModal` l'affichage.
- **OAuth** : `features/auth/services/googleSignIn.ts` et `facebookSignIn.ts` (Google Sign-In, Facebook SDK). Le token obtenu est vérifié par le backend (`/api/auth/google`, `/api/auth/facebook`). Modules natifs : comme le reste de l'app, il faut le build de debug, pas Expo Go.
- **Signature Android** : `plugins/withDebugKeystore.js` remplace pendant `expo prebuild` le keystore de debug du template Expo (partagé par toutes les apps Expo) par `keystores/debug.keystore`. Son SHA-1 `5D:26:8F:52:F7:A8:2D:71:3A:D9:68:BF:60:6A:79:BB:85:AA:71:C0` est celui à enregistrer, avec le package `com.zumik.app`, dans le client OAuth Android du projet Google Cloud qui contient `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. Sinon Google Sign-In renvoie `DEVELOPER_ERROR`.

## Développement

### Imports

Un seul alias, `@/` (vers `src/`), pour tout import qui sort du dossier courant ; jamais de `../` (ESLint) :

```typescript
import { Button } from '@/shared/components/ui/Button';
```

### Primitives et thème

Tout élément pressable passe par `Pressable` ou `Button` de `@/shared/components/ui/` : opacité au toucher commune, retour haptique en option (`haptic`), rôle `button` par défaut et `accessibilityLabel` obligatoire. `TouchableOpacity` et `Pressable` de `react-native` sont interdits ailleurs (ESLint `guardrails/ui-primitives`). Les gestes (swipe, drag & drop) restent sur `react-native-gesture-handler`.

Quatre thèmes vivent dans `src/shared/theme/` (original, royalBlue, pastelLime, christmas), sélectionnables via `ThemeSelector` ; les tokens communs sont dans `src/shared/theme/tokens.ts`. Aucune couleur en dur hors de `src/shared/theme/` (ESLint `guardrails/theme-tokens`) : lire `theme.colors.*`.

### Rôles des composants (plugin ESLint maison)

Les rôles de composants sont validés automatiquement sans exception (#386, documentation : `.agents/rules/components.md`) :

- **`components/screen-orchestrator-only`** : un écran de navigation n'importe que des orchestrators depuis `features/`, jamais de presenters.
- **`components/presenter-pure`** : un presenter est une vue pure (props en entrée, JSX en sortie) : ni état (`useState`), ni effet (`useEffect`), ni store Zustand, ni requête TanStack, ni appel réseau direct.
- **`components/hook-no-jsx`** : un hook ne contient aucun élément JSX ni fragment (logique pure).
- **`components/one-component-per-file`** : au plus un composant React par fichier source.
- **`components/component-role-directory`** : tout composant d'une feature réside dans `features/<feature>/<sujet>/components/orchestrators/` ou `.../components/presenters/`, un provider React dans `features/<feature>/context/`.
- **`components/orchestrator-no-fetch`** : un orchestrator délègue les appels réseau aux hooks TanStack Query ou de service, sans `fetch` direct.

### Hot Reload

Expo supporte le Hot Reload : modifiez n'importe quel fichier et l'app se met à jour automatiquement en 1-2 secondes.

## Alignement Backend

Les types, validateurs et versions sont alignés avec le backend :

- **Types TypeScript** (`src/types/`, `src/features/<feature>/types.ts`) correspondent aux schémas backend
- **Validateurs Zod** (`src/features/playlists/validators.ts`, `src/features/auth/validators.ts`) utilisent les mêmes règles
- **Versions** : Socket.io, Zod identiques au backend

## Tests

Les tests unitaires et de composants s'exécutent avec Jest-Expo, et les règles du plugin ESLint avec `node:test` :

```bash
npm test                # Exécute les tests de règles ESLint puis la suite Jest
npm test -- <path>      # Exécuter une suite de tests ciblée
npm run test:coverage   # Rapport de couverture Jest (au-dessus du plancher de #364 : 69.06% lignes)
```

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
