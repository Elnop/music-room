# Scénario : comportements malveillants

**Prouve** : IV.6, *"must have access to their data, but not to other users' data"* et *"bruteforce of your API, session theft"*.

**Prérequis** : Swagger UI (http://localhost:3000/api-docs) ou `curl`, et les comptes de démo. `RATE_LIMIT_ENABLED` et `ACCOUNT_LOCKOUT_ENABLED` ne doivent pas être à `false` dans `backend/.env`.

## Données d'un autre utilisateur

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | Connecté en Mme Puff : `DELETE /api/playlists/5b0b0000-0000-4000-8000-000000000102` (« Jellyfishing Jams », à Bob) | `403` ; la playlist est toujours là | ☐ |
| 2 | Mme Puff : `GET /api/playlists/5b0b0000-0000-4000-8000-000000000104` (« Plan secret », privée) | Refusé (`403` ou `404`) | ☐ |
| 3 | Mme Puff : `POST /api/music-control/devices/{id d'un appareil de Bob}/licenses/{son propre id}` | Refusé : seul le propriétaire d'un appareil donne une licence | ☐ |
| 4 | Mme Puff : `GET /api/profile/5b0b0000-0000-4000-8000-000000000003` (Carlo) | Profil filtré : bio et goûts absents | ☐ |
| 5 | N'importe quelle route protégée sans jeton | `401` | ☐ |

## Bruteforce

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 6 | `POST /api/auth/login` avec `gary@zumik.dev` et un faux mot de passe, 5 fois (Gary : pour ne pas verrouiller un compte de la démo) | `401` à chaque fois | ☐ |
| 7 | 6ᵉ essai, même avec le bon mot de passe | `429 RATE_LIMIT_EXCEEDED` : le couple email + IP est verrouillé 15 min | ☐ |
| 8 | Expliquer le choix | Le verrou porte sur le couple email + IP : un attaquant ne peut pas bloquer le compte de quelqu'un d'autre depuis son IP. En plus, 20 requêtes d'auth par IP toutes les 15 min, puis la liste noire ([M1](../../security/threat-model.md#m1-password-bruteforce)) | ☐ |

## Vol de session

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 9 | Se connecter en Bob dans Swagger et copier le jeton | — | ☐ |
| 10 | `POST /api/auth/logout` avec ce jeton, puis `GET /api/playlists` avec le même jeton | `401 TOKEN_REVOKED` : un jeton volé ne sert plus après la déconnexion | ☐ |
| 11 | Modifier un caractère d'un jeton valide | `401` | ☐ |

## Secrets

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 12 | `git check-ignore backend/.env mobile/.env` | Les deux fichiers sont ignorés | ☐ |
| 13 | `cd backend && npm run check:secrets` | gitleaks ne trouve rien | ☐ |

## Les autres menaces identifiées

Le sujet demande aussi *"you must identify other hazards and explain the practicable protections"*. On les présente à partir de [threat-model.md](../../security/threat-model.md), une ligne par menace :

| # | Menace à expliquer | Protection | ☐ |
| --- | --- | --- | --- |
| 14 | M2 : bruteforce des codes à 6 chiffres | Nombre d'essais limité par code | ☐ |
| 15 | M3 : prise de compte ou énumération par la vérification et la réinitialisation | Réponse identique que l'email existe ou non ; une réinitialisation ferme les sessions | ☐ |
| 16 | M6 : jeton révoqué alors qu'un socket est déjà ouvert | Jeton révoqué refusé au handshake ; l'app ferme son socket à chaque fin de session | ☐ |
| 17 | M8 : accès direct à Supabase avec la clé anon | La base refuse la clé anon ; l'app n'a aucun client Supabase | ☐ |
| 18 | M9 : abus temps réel (flood d'événements) | Origine contrôlée, handshake authentifié et validé, limites par socket dans Redis (`socket-event-limit.ts`) | ☐ |
| 19 | M10 : room gardée après retrait de l'accès | Éjection immédiate de la room | ☐ |
| 20 | M11 : contrôle d'un appareil non autorisé | Licence vérifiée sur l'appareil visé ; l'identité vient du socket | ☐ |
| 21 | M13 : Redis indisponible | Les protections refusent (503) au lieu de laisser passer | ☐ |
| 22 | Risques acceptés (« Open gaps ») | Jetons non chiffrés sur le téléphone, attaque répartie sur beaucoup d'IP, `http://` en dev : pourquoi c'est accepté | ☐ |

**Attention** : le limiteur global compte toutes les requêtes `/api/auth/*` par IP, réussites comprises (20 par 15 min). Dérouler ce scénario en fin de démo : sinon, les connexions suivantes depuis la même IP reçoivent `429`. Redémarrer Redis remet les compteurs à zéro.

Les procédures détaillées et les autres menaces sont dans [threat-model.md](../../security/threat-model.md).
