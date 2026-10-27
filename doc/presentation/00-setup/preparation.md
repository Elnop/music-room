# Préparation

À faire sur la machine de référence avant l'arrivée du correcteur, depuis un clone propre.

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | `make install` | Toutes les dépendances s'installent à partir des manifestes, rien n'est commité ([III.1](../01-architecture/exigences.md)) | ☐ |
| 2 | Vérifier que `backend/.env` et `mobile/.env` existent (copies de `.env.example` complétées) | Les clés sont présentes en local et absentes de git | ☐ |
| 3 | `make supabase-reset` | Base locale vide puis remplie par les comptes et playlists de démo | ☐ |
| 4 | `make dev-docker` (ou `make dev-local`, ou `make dev-phone` pour un téléphone en USB) | Backend sur :3000, `GET /health` répond | ☐ |
| 5 | Ouvrir http://localhost:3000/api-docs et http://localhost:54424 | Swagger UI et Mailpit s'affichent | ☐ |
| 6 | Installer l'app sur A et B, se connecter avec Bob sur A et Patrick sur B | Les deux arrivent sur **Accueil** | ☐ |
| 7 | Sur A et B : **Profil › Mes appareils** | Chaque téléphone apparaît comme appareil de son compte | ☐ |
| 8 | Ouvrir un terminal sur `make logs-backend` | Chaque action de l'app affiche une ligne `HTTP Request` ([IV.6](../06-security/scenario-logs.md)) | ☐ |
| 9 | Lancer une lecture de « Jellyfishing Jams » sur A | Le son sort : SoundCloud répond | ☐ |

## Remettre à zéro entre deux corrections

`make supabase-reset` recharge les données de démo. Les comptes créés pendant la démo (inscription, Google, Facebook) disparaissent avec.

## Pas de prod

Tout tourne sur la machine de référence : backend, stack Supabase locale, Redis et client web. Si le backend local ne démarre pas, on le répare avant de commencer ; le backend hébergé (prod) n'est pas un plan B, car les comptes de démo n'y existent pas et les mesures IV.7 n'y ont pas été faites.
