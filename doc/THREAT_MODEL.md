# Modèle de menaces - Zumik

Ce document liste les menaces prises en compte pour l'API (`backend/`), le temps réel (Socket.io) et l'app mobile (`mobile/`), exigence IV.6 du sujet (« plan malicious behaviors (bruteforce of your API, session theft, etc.) »). Pour chaque menace : ce qui la bloque, le code qui le fait, le test qui le prouve, ou bien **risque accepté** avec la raison. Les trous trouvés en écrivant ce document sont dans [Lacunes ouvertes](#lacunes-ouvertes) ; ils ne sont pas corrigés ici et deviennent des tickets.

Conteneurs et images Docker : [SECURITY.md](SECURITY.md). Comment tester à la main : [TESTING_SECURITY.md](TESTING_SECURITY.md). Clés Redis : [REDIS.md](REDIS.md).

État relevé sur `develop` au commit `2c1f210`. Chemins relatifs à la racine du dépôt ; `int.test` = test d'intégration (Supabase local + Redis, voir [TESTING.md](TESTING.md)).

## Vue d'ensemble

| # | Menace | Couverture |
|---|--------|------------|
| M1 | Bruteforce du mot de passe | Limiteurs Redis + verrouillage + liste noire d'IP. Seul le limiteur de login est testé. |
| M2 | Bruteforce des codes à 6 chiffres (vérification d'email, reset) | Compteur d'essais par compte et IP. Non testé. Risque accepté pour une attaque répartie sur beaucoup d'IP. |
| M3 | Prise de compte et énumération par la vérification d'email et le reset (#188, #187, #189) | Corrigé et testé. Reste #194. |
| M4 | Bruteforce et rejeu de tokens (#160) | Limite des échecs de vérification par IP, testée. |
| M5 | Vol de session (token volé) | Logout révoque access et refresh token, testé. Risques acceptés : durée de vie du token, stockage en clair sur le téléphone, HTTP en clair en dev. |
| M6 | Token révoqué alors qu'une socket est déjà ouverte | **Risque accepté** : le token n'est vérifié qu'au handshake. L'app ferme sa socket (#70, testé). |
| M7 | Accès aux données d'un autre utilisateur par l'API | Contrôles dans le code (clé service), testés pour playlists et contrôle musical. Filtre de confidentialité du profil non testé. |
| M8 | Accès direct à Supabase avec la clé anon embarquée dans l'app | **Lacune critique** (L1, L2, L3) : RLS trop large sur `user_profiles`, `follows` ; pas de RLS sur `tracks`. |
| M9 | Abus du temps réel (origine, identité forgée, payloads, flood) | Origine, handshake et payloads contrôlés et testés. Pas de limite de débit par événement (L7). |
| M10 | Accès conservé dans une room après son retrait | Revérification et éviction, testées. |
| M11 | Contrôle musical d'un appareil non autorisé | Règle par appareil, fail closed, testée. |
| M12 | Éditions concurrentes de playlist | Verrou par playlist + versions, testé. |
| M13 | Redis indisponible | Limiteurs et révocation fail closed (503), testés. Verrouillage et liste noire fail open. |

## M1. Bruteforce du mot de passe

**Menace.** Un attaquant essaie des mots de passe sur `POST /api/auth/login`, sur un compte ou sur beaucoup.

**Protection.** Dans l'ordre des middlewares de `backend/src/features/auth/auth.routes.ts` :

1. `checkIPBlacklist` (`backend/src/features/auth/middleware/account-lockout.middleware.ts`) sur toutes les routes `/api/auth/*` : une IP en liste noire reçoit `403 IP_BLOCKED`. Une IP y entre après `IP_BLACKLIST_THRESHOLD` (50) échecs de login ou d'OAuth en 15 min, pour 24 h (`recordIPActivity` dans `backend/src/shared/services/brute-force.service.ts`).
2. `globalAuthRateLimiter` (`backend/src/features/auth/middleware/rate-limit.middleware.ts`) : 20 requêtes par IP et 15 min sur `/api/auth/*`.
3. `loginRateLimiter` : 5 échecs par couple email + IP et 15 min (`skipSuccessfulRequests`).
4. `checkAccountLockout` : après 5 échecs pour un couple email + IP (`recordFailedAttempt`, appelé par `AuthController.login` dans `backend/src/features/auth/auth.controller.ts`), le couple est verrouillé 15 min, 1 h à partir de 8 échecs, 24 h à partir de 10 (`lockAccount`). `429 ACCOUNT_LOCKED`.

Les seuils viennent de `backend/src/shared/config/rate-limit.config.ts` (variables d'environnement, valeurs par défaut citées ici). Les compteurs sont dans Redis (`RedisRateLimitStore`, `backend/src/features/auth/utils/redis-rate-limit-store.ts`).

**Tests.**
- `backend/src/features/auth/middleware/rate-limit.int.test.ts` : « stores failed attempts under rl:auth:login: and answers 429 past the limit ».
- `backend/src/features/auth/utils/redis-rate-limit-store.test.ts` : le store échoue fermé (503) sans Redis.
- **Aucun test** pour `brute-force.service.ts`, `checkAccountLockout` ni `checkIPBlacklist` (L9).

**Risques acceptés.**
- Tous les compteurs sont par IP ou par email + IP. Une attaque répartie sur beaucoup d'IP n'est pas bornée par compte. Raison : un verrou par compte seul permettrait à n'importe qui de bloquer le compte d'un autre.
- Sans `trust proxy`, toutes les requêtes passées par un proxy (tunnel ngrok, reverse proxy) partagent une IP : #173.
- `RATE_LIMIT_ENABLED=false` et `ACCOUNT_LOCKOUT_ENABLED=false` coupent ces protections ; c'est un réglage de dev, à laisser actif ailleurs.

## M2. Bruteforce des codes à 6 chiffres

**Menace.** Deviner le code de vérification d'email (`POST /api/auth/verify-email`, il ouvre une session) ou le code de reset (`POST /api/auth/reset-password`, il change le mot de passe). L'espace est de 900 000 codes, valables 15 min.

**Protection.**
- Code tiré par `crypto.randomInt`, comparé par `crypto.timingSafeEqual`, format validé par Zod (`auth.validators.ts`).
- Vérification d'email : `EMAIL_VERIFICATION_MAX_ATTEMPTS` essais par `userId` + IP sur la durée de vie du code (`EmailVerificationService.verifyCode`, `backend/src/features/auth/services/email-verification.service.ts`) ; la route a aussi `loginRateLimiter`, dont la clé est email + IP ; le corps n'ayant pas d'email, c'est 5 échecs par IP et 15 min.
- Reset : 5 essais par email + IP et 15 min (`PasswordResetService.resetPassword`, `backend/src/features/auth/services/password-reset.service.ts`), plus `globalAuthRateLimiter`.
- Les deux compteurs passent par `RateLimiterService` (`backend/src/shared/services/rate-limiter.service.ts`), qui répond 503 sans Redis.

**Tests.** `email-verification.int.test.ts` : « refuses a wrong code with INVALID_CODE ». **Aucun test** ne vérifie le nombre maximal d'essais, ni pour la vérification ni pour le reset (L9).

**Risque accepté.** Comme M1, les essais sont comptés par IP : avec N adresses IP, un attaquant a environ 5 × N essais par code de reset. Raison : même arbitrage que M1 ; la durée de vie de 15 min et la limite de 3 demandes de code par heure et par email + IP (`PasswordResetCooldownService`) bornent la fenêtre.

## M3. Prise de compte et énumération par la vérification d'email et le reset

**Menace.** Obtenir une session sur le compte d'un autre, ou savoir si un email a un compte.

**Protection.**
- `verifyCode` refuse un compte déjà vérifié (`400 ALREADY_VERIFIED`) : plus de session délivrée sans code valide (#188).
- `resendVerification` (`auth.controller.ts`) envoie le code à l'email du compte, jamais à celui du corps, et seulement si l'email du corps correspond (`resolveVerificationRecipient`). Même réponse dans tous les cas, cooldown compté avant toute recherche : un 429 ne trahit pas un compte existant (#188).
- `forgotPassword` répond toujours « If this email exists… » ; le quota horaire et le cooldown sont consommés que l'email existe ou non (`PasswordResetCooldownService.consumeRequest`, #187). `GET /reset-password/can-resend` donne la même réponse pour un email inconnu.
- Un compte Google/Facebook sans mot de passe peut recevoir un code et en définir un (#189) : il faut quand même lire la boîte mail.

**Tests.**
- `backend/src/features/auth/services/email-verification.int.test.ts` : « refuses a verified account with ALREADY_VERIFIED and returns no session », « sends nothing when the body email is not the account email », « answers 429 RESEND_COOLDOWN on a second call even when the email does not match », « sends nothing for an unknown user ».
- `backend/src/features/auth/services/password-reset-resend.int.test.ts` : « reports the same cooldown for an email with no account (no enumeration) ».
- `backend/src/features/auth/services/password-reset-oauth.int.test.ts` : « sends a code, resets, records the password and allows password sign-in ».

**Ouvert.**
- #194 : `listUsers()` sans pagination ; au-delà de la première page, un compte n'est pas trouvé par le reset.
- #196 : `has_password` faux sur d'anciens comptes Google/Facebook.
- Un reset ne termine pas les sessions déjà ouvertes (L5).
- Les codes sont stockés en clair dans `user_profiles`, lisibles avec la clé anon (L1).

## M4. Bruteforce et rejeu de tokens

**Menace.** Envoyer des tokens forgés, expirés ou révoqués en boucle sur les routes protégées ou au handshake Socket.io, pour en trouver un valide ou saturer Supabase Auth.

**Protection.** `verifyTokenLimited` (`backend/src/features/auth/utils/token-verify-limiter.ts`, #160), utilisé par `authMiddleware`, `optionalAuthMiddleware` (`backend/src/features/auth/auth.middleware.ts`) et `authenticateSocket` (`backend/src/realtime/socket-auth.ts`) : les échecs `INVALID_TOKEN` et `TOKEN_REVOKED` sont comptés par IP (20 par 15 min par défaut). Au-delà, l'IP reçoit `429` (HTTP) ou `TOO_MANY_ATTEMPTS` (socket) sans appel à Supabase. Détail dans `backend/README.md`.

**Tests.**
- `backend/src/features/auth/utils/token-verify-limiter.int.test.ts` : « counts failures with an expiry, then answers 429 without calling getUser », « refuses the socket handshake with TOO_MANY_ATTEMPTS without calling getUser ».
- `backend/src/features/auth/utils/token-verify-limiter.test.ts` : « lets at most max of a parallel burst of invalid tokens reach verify ».

**Risque accepté.** Sans Redis, ce limiteur ne bloque ni ne compte ; `verifyToken` répond déjà 503 dans ce cas (M13). IP partagée : #173.

## M5. Vol de session

**Menace.** Un tiers obtient l'access token ou le refresh token d'un utilisateur et agit en son nom.

**Protection.**
- `POST /api/auth/logout` met le hash SHA-256 de l'access token dans une liste de révocation Redis jusqu'à son `exp` (`TokenRevocationService.revoke`, `backend/src/features/auth/services/token-revocation.service.ts`), puis termine la session Supabase avec `signOut(token, 'local')`, ce qui invalide le refresh token (`SessionService.logout`, `backend/src/features/auth/services/session.service.ts`). Les autres appareils de l'utilisateur restent connectés.
- Chaque requête vérifie la liste de révocation avant Supabase (`SessionService.verifyToken`) ; sans Redis, `503 REVOCATION_UNAVAILABLE`, jamais une acceptation.
- `POST /api/auth/refresh` répond 401 à un refresh token refusé et 503 si Supabase est indisponible (#126) : l'app ne déconnecte pas l'utilisateur pour une panne.
- Mobile : `endSessionLocally` (`mobile/src/store/authStore.ts`) efface la session même si l'appel backend échoue.

**Tests.**
- `backend/src/features/auth/services/logout.int.test.ts` : « rejects the old access token and the old refresh token », « keeps the same user's other session signed in ».
- `backend/src/features/auth/services/session.service.test.ts` : « rejects a revoked token with 401 TOKEN_REVOKED without calling Supabase », « keeps the 503 REVOCATION_UNAVAILABLE from the denylist check », cas 401 / 503 de `refreshToken`.
- `backend/src/features/auth/services/token-revocation.service.test.ts` : « stores a SHA-256 hash of the token, never the token ».
- `backend/src/features/auth/auth.middleware.test.ts` : « answers 401 TOKEN_REVOKED for a token revoked by a logout ».
- `mobile/src/store/authStore.test.ts` : « still ends the session when the backend logout fails ».

**Risques acceptés.**
- Un token volé reste valable jusqu'à sa révocation ou son expiration (durée de vie fixée par Supabase Auth). Il n'y a pas de liaison du token à l'appareil.
- Les tokens sont stockés dans AsyncStorage (`mobile/src/store/authStore.ts`, `mobile/src/lib/supabase.ts`), non chiffré. Raison : il faut un téléphone rooté ou un accès physique ; `expo-secure-store` serait l'amélioration.
- En `make dev-docker` et `make dev-local`, l'app parle au backend en `http://` et `ws://` sur le réseau local (`DEV_API_URL` dans `make/config.mk`) : tokens en clair sur le Wi-Fi. `make dev-tunnel` passe par HTTPS (ngrok). Raison : environnement de développement, pas de déploiement de production.

## M6. Token révoqué alors qu'une socket est déjà ouverte

**Menace.** Après un logout (ou l'expiration du token), une socket ouverte avant continue de recevoir les événements (`playlist:updated`, `listening:status`, `control:command`) et d'en envoyer.

**Protection.**
- Au handshake, un token révoqué est refusé (`authenticateSocket` passe par `SessionService.verifyToken`) : #71.
- L'app ferme sa socket à chaque fin de session : abonnement `useAuthStore.subscribe` dans `mobile/src/store/socketStore.ts` (#70).

**Tests.**
- `backend/src/realtime/socket-auth.int.test.ts` : « refuses a token revoked by logout with INVALID_TOKEN (#71) ».
- `mobile/src/store/authStore.test.ts` : « revokes the session on the backend, disconnects the socket and clears the session ».

**Risque accepté.** Le token n'est vérifié qu'au handshake (documenté dans `backend/README.md`). Un client malveillant qui garde sa socket ouverte après le logout, ou au-delà de l'expiration de son token, reste connecté jusqu'à ce qu'il se déconnecte ou que le serveur redémarre. #70 couvre l'app, pas un client modifié. Raison : seule l'app officielle se déconnecte d'elle-même ; revérifier le token à chaque événement, ou déconnecter les sockets de l'utilisateur au logout, serait le correctif (L6). Les droits sur les rooms restent revérifiés à chaque changement (M10), donc une telle socket ne gagne pas d'accès.

## M7. Accès aux données d'un autre utilisateur par l'API

**Menace.** Un utilisateur authentifié lit ou modifie les playlists, appareils, profils ou réglages d'un autre en changeant un identifiant dans la requête.

**Protection.** Le backend parle à Supabase avec la clé service (`supabaseAdmin` et son alias `supabase`, `backend/src/shared/config/supabase.ts`), qui **ignore la RLS** : toutes les features (`auth`, `friends`, `music-control`, `playlists`, `profile`, `realtime`) l'utilisent. L'isolation est donc dans le code :
- Toutes les routes de `playlists`, `profile`, `friends`, `music-control` passent par `authMiddleware` (`router.use(authMiddleware)` dans chaque `*.routes.ts`) ; l'identité vient du token (`req.user.id`), jamais du corps.
- Playlists : `canViewPlaylist`, `canEditPlaylist`, `checkOwnership`, `checkEditPermission` dans `backend/src/features/playlists/permissions/playlist.permissions.ts`.
- Contrôle musical : `ControlAccessService` (M11) ; un appareil n'est licencié que par son propriétaire (`findOwnedDevice` dans `DeviceLicenseService.grant`).
- Profil d'un autre utilisateur : `PrivacyService.getFilteredProfile` (`backend/src/features/profile/services/privacy.service.ts`) applique ses réglages de confidentialité.
- Toutes les entrées sont validées par Zod (`*.validators.ts`).

**Tests.**
- `backend/src/features/playlists/permissions/playlist.permissions.test.ts` (`canViewPlaylist`, `canEditPlaylist`, `checkEditPermission`).
- `backend/src/features/playlists/services/playlist-track.int.test.ts` : « refuses every operation to a user without the edit right ».
- `backend/src/features/music-control/services/device-license.int.test.ts` : « refuses a grant on another user's device or an unknown device », « refuses a revoke on another user's device and leaves its license untouched ».
- **Aucun test** pour `getFilteredProfile` ni pour les routes profil (prévu par #98) (L9).

## M8. Accès direct à Supabase avec la clé anon

**Menace.** L'app contient `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` (`mobile/src/lib/supabase.ts`) ; n'importe qui peut les extraire de l'APK et appeler PostgREST directement, anonymement ou avec son propre token. Seules la RLS et les privilèges SQL protègent alors les tables.

**Où la RLS s'applique.** Seulement à ces accès directs, jamais au backend (clé service). Politiques dans `backend/migrations/*.sql` :

| Table | RLS | Lecture | Écriture |
|-------|-----|---------|----------|
| `user_profiles` | oui (001) | **tout le monde** (`USING (true)`) | la ligne de l'utilisateur, **toutes colonnes** |
| `playlists` | oui (003) | publique, propriétaire ou collaborateur | propriétaire |
| `playlist_tracks` | oui (003, 016) | comme `playlists` | aucune politique depuis 016 : écriture refusée |
| `tracks` | **non** | **tout le monde** | **tout le monde** |
| `follows` | oui (007) | tout le monde | insert / delete par le `follower_id` |
| `profile_privacy` | oui (011) | soi | soi |
| `music_preferences` | oui (011) | tout le monde (ignore la confidentialité) | soi |
| `devices`, `device_control_licenses` | oui (015) | soi / propriétaire ou bénéficiaire | soi / propriétaire |
| fonctions `rank_*`, `playlist_*` | — | `EXECUTE` retiré à `anon` et `authenticated` (016) | idem |

Vérifié sur la base de test locale construite depuis ces migrations (`backend/scripts/test-db.sh`) : `anon` et `authenticated` ont les privilèges de table par défaut de Supabase (SELECT, INSERT, UPDATE, DELETE), `tracks` a `relrowsecurity = false`, et une requête PostgREST anonyme `GET /rest/v1/user_profiles?select=password_reset_code` répond 200. Non vérifié sur le projet Supabase hébergé.

**Tests.** `backend/src/features/playlists/services/track-operations.int.test.ts` : « refuses every 016 function to the anon key with a permission error », « refuses direct inserts and deletes on playlist_tracks to the playlist owner ». Rien d'autre.

**Lacunes.** L1, L2, L3 ci-dessous. Ce sont les seules failles critiques relevées.

## M9. Abus du temps réel

**Menace.** Se connecter depuis un site web tiers, se faire passer pour un autre utilisateur ou un autre appareil, envoyer des payloads malformés ou inonder le serveur d'événements.

**Protection.**
- Origine : `allowRequest` et `cors` dans `RealtimeService.initialize` (`backend/src/realtime/index.ts`) appliquent `isOriginAllowed` / `isSameOrigin` (`backend/src/shared/config/cors.config.ts`, `ALLOWED_ORIGINS`, #137). Une connexion sans en-tête `Origin` (app native) est acceptée : la règle d'origine ne protège que des navigateurs, l'authentification fait le reste. En `NODE_ENV=development`, toute origine `ngrok` ou `exp://` est acceptée.
- Handshake : token obligatoire et vérifié, champs validés par Zod (`handshakeAuthSchema`), appareil enregistré en base avant acceptation (`authenticateSocket`, `backend/src/realtime/socket-auth.ts`). L'identité (`socket.data.userId`) vient du token seul.
- Événements : `playlist:join` / `leave` (UUID), `listening:subscribe` / `unsubscribe` (UUID), `control:action` (`controlActionSchema`, champs inconnus retirés) validés avant toute lecture en base (`backend/src/realtime/playlist-room.ts`, `backend/src/realtime/music-control-access.ts`) ; `listening:update` validé par `isValidListeningUpdatePayload` et limité à une application par seconde et par appareil (`LatestThrottle`, `backend/src/realtime/latest-throttle.ts`, #151). L'appareil vient du handshake, jamais du payload.
- Chaque événement entrant est loggé avec plateforme, appareil et version (subject IV.6).

**Tests.**
- `backend/src/realtime/socket-origin.int.test.ts` : « refuses a %s connection from an origin outside ALLOWED_ORIGINS », « accepts a connection without Origin header ».
- `backend/src/realtime/socket-auth.int.test.ts` : « refuses a handshake without token with NO_TOKEN », « refuses a missing or non-string device field with INVALID_HANDSHAKE », « ignores a forged userId in the handshake », « stores listening:update with the handshake device, not the payload one », « keeps the latest listening:update of a burst (#151) ».
- `backend/src/realtime/music-control-access.int.test.ts` : « refuses Carol even when the payload claims to come from Bob », « ignores a forged sender field from an allowed controller », « answers malformed payloads with INVALID_PAYLOAD and keeps serving the socket ».

**Risque accepté / lacune.** Pas de limite de débit sur `control:action`, `listening:subscribe` ni `playlist:join` (chacun fait des lectures en base), ni sur le nombre de connexions d'un utilisateur ; les chaînes `title` / `artist` de `listening:update` n'ont pas de longueur maximale (seule borne : `maxHttpBufferSize` par défaut de Socket.io, 1 Mo). Voir L7.

## M10. Accès conservé dans une room après son retrait

**Menace.** Un viewer ou collaborateur retiré, un ami qui n'est plus ami, ou un contrôleur dont la licence est retirée reste dans `playlist:<id>` ou `listening:<ownerId>` et continue de recevoir les événements.

**Protection.**
- Playlists : après le retrait d'un viewer (`viewer.service.ts`) ou d'un collaborateur (`collaborator.service.ts`), une mise à jour (visibilité) ou une suppression (`playlist.service.ts`), `realtime.revalidatePlaylistRoom` refait `canViewPlaylist` pour chaque socket de la room et évince celles qui ont perdu l'accès (`revalidatePlaylistRoom`, `backend/src/realtime/playlist-room.ts`). Les `join` / `leave` d'une socket sont traités dans l'ordre d'arrivée.
- Écoute : après le retrait de l'interrupteur ou d'une licence (`realtime.notifyPermissionChange`) et après un `unfollowUser` (`friends.service.ts`, `backend/src/features/friends/utils/listening-access.ts`), `revalidateListeningAccess` sort les sockets du contrôleur de `listening:<ownerId>` s'il ne lui reste aucun appareil ; une erreur évince (fail closed). `listening:subscribe` revérifie l'accès après avoir rejoint la room.

**Tests.**
- `backend/src/realtime/playlist-room.int.test.ts` : « evicts a viewer removed while in the room », « evicts a collaborator removed while in the room », « evicts the outsider when a public playlist becomes private », « evicts everyone when the playlist is deleted », « handles join then leave in order: the socket ends outside the room ».
- `backend/src/realtime/music-control-access.int.test.ts` : « removes Bob's sockets when Alice revokes his control », « removes Bob's sockets when he unfollows Alice », « evicts Bob when Alice revokes his last license », « keeps Bob subscribed when the switch is cut but a license remains ».
- `backend/src/realtime/playlist-room.test.ts` : « evicts nobody when the lookup fails ».

**Risques acceptés.**
- `revalidatePlaylistRoom` n'évince personne si la lecture de la playlist échoue (fail open, choisi pour ne pas expulser les membres d'une playlist qui existe encore ; test ci-dessus). La revérification est lancée sans attendre (fire-and-forget) : quelques événements peuvent partir entre le changement et l'éviction.
- #159 : un `listening:subscribe` suivi d'un `listening:unsubscribe` rapide laisse la socket abonnée. L'accès reste revérifié à chaque retrait, donc ce n'est pas un gain de droits.

## M11. Contrôle musical d'un appareil non autorisé

**Menace.** Envoyer `play` / `pause` à un appareil qu'on n'a pas le droit de contrôler, ou voir le statut d'écoute d'un utilisateur sans accès.

**Protection.** `ControlAccessService` (`backend/src/features/music-control/services/control-access.service.ts`) : il faut être amis mutuels, et que le propriétaire ait ouvert l'interrupteur « tous mes appareils » (`follows.can_control_music`) ou donné une licence sur cet appareil (`device_control_licenses`, `DeviceLicenseService`, `backend/src/features/music-control/services/device-license.service.ts`). Toute erreur de base répond « pas d'accès » (`safeAccess`). `control:action` vérifie l'accès avant de regarder si l'appareil est en ligne : un refusé n'apprend rien sur les appareils. Le bénéficiaire est prévenu des octrois et retraits de licence par `permission:changed` (#183).

**Tests.**
- `backend/src/features/music-control/services/control-access.service.test.ts` : « allows the licensed device only, between mutual friends with the switch off », « refuses a stale switch when the owner does not follow back », « refuses when the client throws ».
- `backend/src/realtime/music-control-access.int.test.ts` (bloc « per-device access (story 4.5) ») : « delivers to the licensed device only, until B is licensed or the switch is on », « refuses B once the switch is cut, and still reaches the licensed A », « tells Bob when Alice revokes a license, with whether access remains (#183) ».
- `backend/src/features/music-control/services/device-license.int.test.ts` : « refuses a grant to a non-friend (one-way follow or none) ».

**Lacune.** Par accès direct à Supabase, un contrôleur peut se donner l'interrupteur lui-même (L2).

## M12. Éditions concurrentes de playlist

**Menace.** Deux éditeurs modifient la même playlist en même temps : pistes perdues, dupliquées, ordre différent selon les clients.

**Protection.** Décrite dans [PLAYLIST_CONCURRENCY.md](PLAYLIST_CONCURRENCY.md) : chaque opération est une fonction Postgres (migration 016) qui verrouille la ligne de la playlist ; rangs fractionnaires ; `tracks_version` et `moved_at_version` ; un déplacement basé sur une version périmée de la même piste reçoit `409`. L'écriture directe de `playlist_tracks` est fermée (M8).

**Tests.** Ceux listés dans [PLAYLIST_CONCURRENCY.md](PLAYLIST_CONCURRENCY.md#tests), dont `backend/src/features/playlists/services/track-operations.int.test.ts` : « lets exactly one of N concurrent moves of the same track win », « keeps every invariant under a burst of concurrent moves, adds and removes ».

**Risque accepté.** Les listes `viewer_ids` et `collaborator_ids` sont modifiées en lecture puis écriture, sans verrou (`viewer.service.ts`, `collaborator.service.ts`) : deux changements simultanés du propriétaire peuvent en perdre un. Seul le propriétaire les modifie, l'effet est visible et se corrige en recommençant.

## M13. Redis indisponible

**Menace.** Faire tomber ou saturer Redis pour désactiver les limites et la révocation.

**Protection.** Fail closed : les limiteurs `express-rate-limit` répondent `503 RATE_LIMIT_UNAVAILABLE` (`RedisRateLimitStore`), `RateLimiterService` répond `503 REDIS_UNAVAILABLE`, la révocation répond `503 REVOCATION_UNAVAILABLE`, donc aucune route protégée n'accepte de token sans Redis. Choix documenté dans [REDIS.md](REDIS.md) (« No In-Memory Fallback »).

**Tests.** `redis-rate-limit-store.test.ts` : « throws 503 and sends nothing while Redis is not ready », « fails closed again when Redis drops after creation, then resumes » ; `token-revocation.service.test.ts` : « throws 503 REVOCATION_UNAVAILABLE when Redis is not ready » ; `auth.middleware.test.ts` : « answers 503 REVOCATION_UNAVAILABLE when the denylist cannot be checked ».

**Risque accepté.** `checkAccountLockout`, `checkIPBlacklist` et `brute-force.service.ts` laissent passer en cas d'erreur Redis (fail open). Le limiteur de login, placé avant, échoue fermé, donc une panne Redis complète bloque le login au lieu de l'ouvrir ; seule une erreur ponctuelle sur une commande Redis laisse passer une tentative. En dev, Redis est exposé sans mot de passe (L8).

## Lacunes ouvertes

Trouvées en écrivant ce document, non corrigées ici. Chacune est à transformer en ticket.

| # | Gravité | Lacune | Où |
|---|---------|--------|-----|
| L1 | **Critique** | `user_profiles` est lisible par tous (`USING (true)`), y compris `password_reset_code` et `verification_code`. Avec la clé anon de l'APK : demander un reset pour la victime (`forgot-password`), lire le code, changer son mot de passe. Prise de compte sans accès à la boîte mail. Expose aussi tous les profils sans filtre de confidentialité. | `backend/migrations/001_initial_schema.sql`, `013_email_verification.sql`, `014_password_reset.sql` |
| L2 | Haute | La politique UPDATE de `user_profiles` autorise toutes les colonnes de sa propre ligne : un utilisateur peut se mettre `email_verified = true` sans code. La politique INSERT de `follows` ne contrôle pas `can_control_music` : un contrôleur peut supprimer puis recréer sa ligne `follows` vers le propriétaire avec `can_control_music = true` et, si le propriétaire le suit, contrôler tous ses appareils. | `001_initial_schema.sql`, `007_follows.sql`, `009_music_control.sql` |
| L3 | Haute | `tracks` n'a pas de RLS : lecture, modification et suppression par la clé anon. `music_preferences` et `follows` sont lisibles par tous, sans les réglages de confidentialité. | `003_playlist_persistence.sql`, `011_profile_privacy_and_preferences.sql`, `007_follows.sql` |
| L4 | Moyenne | Toutes les limites anti-bruteforce sont par IP (M1, M2) ; IP faussée derrière un proxy. | #173 (existe) |
| L5 | Moyenne | Un reset de mot de passe ne termine pas les sessions ouvertes : un voleur de session la garde après que la victime a changé son mot de passe. | `PasswordResetService.resetPassword` |
| L6 | Moyenne | Une socket ouverte survit au logout et à l'expiration du token (M6). | `backend/src/realtime/socket-auth.ts` |
| L7 | Basse | Pas de limite de débit par événement socket ni de longueur max sur `listening:update` (M9). | `backend/src/realtime/index.ts` |
| L8 | Basse (dev) | Redis est publié sur le port 6379 de toutes les interfaces de l'hôte, sans mot de passe : quelqu'un sur le même réseau peut effacer les verrous, la liste noire et la liste de révocation. | `make/helpers/docker.mk` (`start_redis`), voir [SECURITY.md](SECURITY.md) |
| L9 | Tests | Pas de test pour : `brute-force.service.ts`, `checkAccountLockout`, `checkIPBlacklist`, le nombre max d'essais des codes de vérification et de reset, `PrivacyService.getFilteredProfile`. | — |

Déjà suivis ailleurs : #159 (M10), #173 (L4), #194 et #196 (M3).
