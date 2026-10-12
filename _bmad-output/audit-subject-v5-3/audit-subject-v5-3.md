# Audit de conformité : sujet Music Room v5.3 vs code

- **Date** : 2026-10-05
- **Commit audité** : `4bf34d6` (branche `develop`)
- **Source** : `doc/en.subject.pdf` (v5.3). Le sujet prime sur tout autre document.
- **Méthode** : chaque exigence du sujet est vérifiée dans le code (pas dans la doc ni dans `TODO.md`, qui étaient en partie périmés). Chaque statut cite le fichier qui le prouve.

Légende : ✅ fait · ⚠️ partiel · ❌ absent

> Rappel du sujet : les bonus (chapitre V) ne sont évalués que si la partie obligatoire est **parfaite**. Toute la priorité va donc à la partie obligatoire.

## Synthèse

| Exigence | Statut | Écart principal |
|---|---|---|
| III.1 Architecture, dépendances | ⚠️ | Dépendances OK ; choix techniques non justifiés par écrit |
| III.2 Expérience mobile | ✅ | — |
| IV.1 Utilisateur | ⚠️ | Pas de liaison explicite d'un compte Google/Facebook depuis l'app |
| IV.2 Services (2 sur 3) | ⚠️ | Délégation : licence par ami, pas par appareil. Éditeur : réordonnancement non sûr en concurrence |
| IV.3 Serveur | ✅ | — |
| IV.4 API | ⚠️ | 8 endpoints absents de Swagger ; REST/JSON non justifiés par écrit |
| IV.5 Application mobile | ⚠️ | Adresse du backend configurable seulement au build, pas dans l'app |
| IV.6 Sécurité | ❌ | **Socket.io sans authentification** ; logout sans révocation ; dangers non documentés |
| IV.7 Montée en charge | ❌ | Aucun test de charge, aucune mesure, aucune doc |
| IV.8 Agilité, qualité, CI | ❌ | Aucun test, aucune CI ; `.env` bien ignoré |

## Détail par exigence

### III.1 Architecture logicielle

- ✅ Aucune lib commitée, dépendances installées par `make install` (`make/install.mk`, `make/deps.mk`).
- ⚠️ « You will have to justify your decisions » : aucun document ne justifie le choix Node/Express/Supabase/Redis/Socket.io face aux alternatives.

### III.2 Expérience mobile

- ✅ App Android/iOS en Expo React Native couvrant les actions du projet (`mobile/src/screens/`).

### IV.1 Utilisateur

- ✅ Inscription email/mot de passe et via Google/Facebook (`backend/src/features/auth/auth.routes.ts` : `/register`, `/google`, `/facebook` ; `mobile/src/screens/auth/LoginScreen.tsx`, `RegisterScreen.tsx`).
- ⚠️ **Liaison d'un compte réseau après inscription** : le backend lie automatiquement Google/Facebook seulement si l'email du réseau est identique (`backend/src/features/auth/services/user.service.ts`, `createOAuthUser`). Il n'existe ni endpoint de liaison pour un utilisateur connecté, ni écran pour le faire : seuls `GET /providers` et `DELETE /providers/:provider` existent, et aucun écran mobile ne les utilise. La branche `28-implement-account-linking-for-social-networks` ne contient qu'un commit Makefile.
- ✅ Profil avec infos publiques / amis / privées : visibilité par champ `public`, `friends_only`, `private` (`backend/migrations/011_profile_privacy_and_preferences.sql`), appliquée à la lecture (`backend/src/features/profile/services/privacy.service.ts`, `isFieldVisible`) ; écrans `PrivacySettingsScreen.tsx`, `EditProfileScreen.tsx`.
- ✅ Préférences musicales (`/api/profile/music-preferences`, `MusicPreferencesScreen.tsx`).
- ✅ Validation de l'email obligatoire avant login (`backend/src/features/auth/auth.service.ts`, ligne ~172) et mot de passe oublié (`/forgot-password`, `/reset-password` ; `EmailVerificationScreen.tsx`, `ForgotPasswordScreen.tsx`, `ResetPasswordScreen.tsx`).

### IV.2 Services

- ✅ 2 services sur 3 : Music Control Delegation et Music Playlist Editor. Music Track Vote n'est volontairement pas implémenté.

#### IV.2.2 Music Control Delegation

- ✅ Délégation du contrôle à différents amis (`follows.can_control_music`, `backend/src/features/music-control/`, `DeviceListeningCard.tsx`).
- ⚠️ **« Licence spécifique à chaque appareil rattaché au compte »** : la permission est stockée par paire d'utilisateurs (`backend/migrations/009_music_control.sql`) et vérifiée par utilisateur (`backend/src/realtime/index.ts`, `control:action` → `musicControlService.canControl(controllerId, targetUserId)`). Les appareils existent seulement en mémoire, à l'exécution (`socketToDevice`) : aucune table d'appareils, aucune permission par appareil.

#### IV.2.3 Music Playlist Editor

- ✅ Édition multi-utilisateur en temps réel (`playlist:updated` émis à chaque modification, `backend/src/realtime/index.ts`, `notifyPlaylistUpdate`).
- ✅ Visibilité publique par défaut ; privée = seuls les invités voient la playlist (`playlist.validators.ts` `.default('public')`, `permissions/playlist.permissions.ts`, `canViewPlaylist`).
- ✅ Licence : tout le monde édite par défaut (`edit_mode` `open`), seuls les invités éditent en mode `restricted` (`canEditPlaylist`).
- ⚠️ **Concurrence**, que le sujet cite explicitement (« if several people move different tracks or the same one ») : `reorderTracks` supprime toutes les lignes puis les réinsère, sans transaction ni contrôle de version (`backend/src/features/playlists/services/playlist-track.service.ts`, ~ligne 136). Deux réordonnancements ou un ajout simultané peuvent perdre des tracks ou écraser silencieusement l'ordre d'un autre, et `added_by` est réécrit avec l'auteur du réordonnancement.

### IV.3 Serveur

- ✅ Toutes les données sont stockées côté backend (Supabase), qui fait référence.

### IV.4 API

- ✅ API REST + JSON documentée avec Swagger (`/api-docs`, un fichier `*.openapi.ts` par feature).
- ⚠️ **Endpoints absents de Swagger** : `POST /api/auth/verify-email`, `POST /api/auth/resend-verification`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET /api/auth/reset-password/can-resend`, `GET /api/playlists/public`, `GET /api/soundcloud/stream` (variante en query) et `GET /health`.
- ⚠️ Le choix REST/JSON et ses caractéristiques ne sont justifiés nulle part par écrit (le sujet demande de pouvoir le justifier).

### IV.5 Application mobile

- ✅ L'app est une « télécommande » du backend : toutes les données passent par l'API.
- ✅ Authentification Google et Facebook dans l'app (`mobile/src/services/oauth.ts`).
- ⚠️ **Adresse du backend « configurable dans l'application pour les tests »** : elle vient de `EXPO_PUBLIC_API_URL` au moment du build (`mobile/src/constants/index.ts`, `make set-backend-url`). Aucun réglage dans l'app ne permet de la changer sans rebuild.

### IV.6 Sécurité

- ✅ Isolation des données par HTTP : toutes les routes playlists exigent `authMiddleware` et vérifient vue et édition ; le profil d'un autre utilisateur est filtré selon la confidentialité.
- ✅ Anti-bruteforce : rate limiting Redis (`features/auth/middleware/rate-limit.middleware.ts`) et verrouillage de compte (`shared/services/brute-force.service.ts`).
- ✅ Logs backend de chaque action avec plateforme, appareil et version (`shared/middleware/action-logger.middleware.ts`, headers envoyés par `mobile/src/services/api.ts`) ; logs des sockets (`socket-logger.middleware.ts`).
- ✅ Aucun `.env` commité, ni aujourd'hui ni dans l'historique git.
- ❌ **Socket.io sans authentification** (`backend/src/realtime/index.ts`) :
  - `auth:register` accepte le `userId` envoyé par le client, sans token. N'importe quel client peut se déclarer comme n'importe quel utilisateur, rejoindre sa room `user:<id>`, recevoir son statut d'écoute et ses commandes, et envoyer des `control:action` en son nom vers tous ceux qui lui ont délégué le contrôle.
  - `playlist:join` ne vérifie pas `canViewPlaylist` : les mises à jour d'une playlist privée sont reçues par quiconque connaît son id.
- ⚠️ **Vol de session** : `POST /api/auth/logout` se contente de loguer (`auth.controller.ts`, `logout`). Les tokens restent valides jusqu'à expiration.
- ⚠️ **« Identifier les autres dangers et expliquer les protections »** : `doc/TESTING_SECURITY.md` décrit des tests, mais aucun document ne recense les menaces et leurs protections. `doc/SECURITY.md` parle d'images Docker Chainguard alors que les Dockerfiles utilisent `node:20-alpine`.

### IV.7 Montée en charge

- ❌ Aucun script de charge (AB, Siege, Gatling, JMeter, k6…), aucune mesure, aucune documentation des capacités serveur (CPU, RAM, cloud ou local) ni du nombre maximum d'utilisateurs simultanés.

### IV.8 Agilité, qualité, intégration continue

- ❌ **Aucun test** : ni backend ni mobile ; `make test` affiche « No tests configured » et réussit (`make/quality.mk`). Le sujet demande des tests ponctuels pour chaque couche.
- ❌ Aucune CI (pas de `.github/workflows`).
- ✅ Agilité : issues GitHub, branches par issue, et maintenant BMAD (`_bmad-output/`, tickets en GitHub Issues).
- ✅ Credentials dans `.env` ignorés par git.

## Écarts à traiter, par priorité

### P0 : bloquants pour la soutenance (partie obligatoire)

1. Authentifier Socket.io avec le JWT, prendre le `userId` du token et non du client, et vérifier l'accès avant `playlist:join` et `listening:subscribe` (IV.6).
2. Tests de charge : scripts reproductibles (`make perf-test`), mesures, document avec la config serveur et le nombre max d'utilisateurs simultanés (IV.7).
3. Tests par couche : framework backend et mobile, tests unitaires et d'intégration des services critiques, `make test` réel (IV.8).
4. Licence de délégation par appareil : appareils persistés et permission par appareil (IV.2.2).
5. Réordonnancement concurrent sûr : opération atomique, en transaction ou RPC, avec contrôle de version ou déplacement unitaire, et conservation de `added_by` (IV.2.3).
6. Liaison d'un compte Google/Facebook pour un utilisateur connecté : endpoint et écran (IV.1).

### P1 : exigences partielles faciles à fermer

7. Documenter dans Swagger les 8 endpoints manquants (IV.4).
8. Adresse du backend modifiable dans l'app, par exemple dans les réglages ou l'écran d'accueil (IV.5).
9. Révocation des tokens au logout (IV.6).
10. Document « menaces et protections » (IV.6), et correction de `doc/SECURITY.md`.
11. Document de justification des choix : backend, base de données, REST et JSON, temps réel (III.1, IV.4).

### P2 : qualité et ménage

12. CI GitHub Actions : lint, type-check et tests sur les PR vers `develop` (IV.8).
13. Remplacer `TODO.md`, devenu périmé, par les tickets GitHub.
14. Trier les branches non mergées : `feature/aggressive-updates` (6 commits), `28-implement-account-linking-for-social-networks` (1 commit Makefile).
15. Issue #29 (emojis remplacés par Phosphor Icons) : cosmétique, hors exigences.
16. Supprimer le barrel `mobile/src/types/index.ts` (règle de `AGENTS.md`).
17. Fixer la version de Node, aujourd'hui non tranchée (`backend/Dockerfile` en Node 20).
