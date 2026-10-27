# IV.6 Sécurité

## Ce que dit le sujet

> *"An authenticated user on your solution must have access to their data, but not to other users' data. You must plan malicious behaviors (bruteforce of your API, session theft, etc.) but your API is not expected to be unbreakable: you must implement mechanisms to protect your users, you must identify other hazards and explain the practicable protections."*

> *"Any action on the mobile application must generate logs on the back-end. Platform (Android, iOS, etc.), Device (iPhone 6G, iPad Air, Samsung Edge, etc.), Application Version."*

> *"For obvious security reasons, any credentials, API keys, env variables etc... must be saved locally in a .env file and ignored by git."* (IV.8)

## Ce qu'on livre

- **Isolation des données** : chaque route protégée passe par `authMiddleware`. L'identité vient du jeton, jamais du corps de la requête, et chaque feature vérifie les droits dans son dossier `permissions/`. Le handshake Socket.io est authentifié, et l'accès à une room est revérifié quand il peut se perdre.
- **Bruteforce** : limites de débit et verrouillage de compte, dans Redis :
  - 20 requêtes d'authentification par IP toutes les 15 min ;
  - 5 échecs de connexion par couple email + IP, puis 15 min de verrouillage ;
  - liste noire d'IP ;
  - nombre d'essais limité sur les codes à 6 chiffres.

  Sans Redis, ces protections **refusent** (503) au lieu de laisser passer.
- **Vol de session** : la déconnexion révoque le jeton d'accès (liste de révocation dans Redis) et invalide le refresh token.
- **Autres menaces identifiées** : abus temps réel, accès aux rooms après retrait, contrôle d'un appareil non autorisé, accès direct à Supabase. Chaque menace a sa protection, son test ou le risque accepté, dans [threat-model.md](../../security/threat-model.md) (M1 à M14, plus les failles ouvertes).
- **Logs** : chaque requête HTTP et chaque événement socket sont journalisés avec la plateforme, l'appareil et la version de l'app. L'app envoie `X-Platform`, `X-Device-Model` et `X-App-Version` (`action-logger.middleware.ts`, `socket-logger.middleware.ts`).
- **Secrets** : uniquement dans `backend/.env` et `mobile/.env`, ignorés par git, avec des `.env.example` à placeholders. gitleaks tourne à chaque commit et en CI.

## Où regarder

- [threat-model.md](../../security/threat-model.md) : la liste des menaces à présenter, la partie *"identify other hazards and explain the practicable protections"*
- `backend/src/shared/security/`, `backend/src/features/auth/auth.middleware.ts`, `backend/src/shared/middleware/action-logger.middleware.ts`
- [containers.md](../../security/containers.md) pour les conteneurs

## Scénarios

- [scenario-logs.md](scenario-logs.md) : chaque action de l'app laisse une trace
- [scenario-attacks.md](scenario-attacks.md) : accès aux données d'un autre, bruteforce, vol de session

## Écarts assumés

Ils sont listés dans [threat-model.md](../../security/threat-model.md#open-gaps). Par exemple :

- les jetons sont stockés en AsyncStorage non chiffré ;
- les compteurs sont par IP, donc une attaque répartie sur beaucoup d'IP n'est pas bornée par compte ;
- en développement, le trafic passe en `http://`.
