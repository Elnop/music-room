# Matériel

| Quoi | Pour | Remarque |
| --- | --- | --- |
| Téléphone Android A | Toutes les démos | Build debug (`cd mobile && npx expo run:android --app-id com.zumik.app.dev`) ou APK de release. Jamais Expo Go : il plante faute de modules natifs |
| Téléphone Android B | Temps réel, délégation, iBeacon | Un second appareil est indispensable pour montrer le temps réel. En secours, le client web (`make dev-web`) peut remplacer B partout, sauf pour la démo iBeacon (V.2) |
| Ordinateur | Backend, Swagger UI, logs, Mailpit, client web | Docker démarré (stack Supabase locale, Redis, semgrep, gitleaks) |
| Navigateur (Chrome) | Swagger UI, Mailpit, client web (V.1) | |
| Câble USB ou même Wi-Fi | Joindre le backend depuis les téléphones | `make dev-tunnel` si les téléphones sont sur un autre réseau ([tunnel-mode.md](../../development/tunnel-mode.md)) |

## Adresses utiles (stack locale)

| Service | Adresse |
| --- | --- |
| API | http://localhost:3000 |
| Swagger UI | http://localhost:3000/api-docs |
| Mailpit (emails envoyés en local) | http://localhost:54424 |
| Client web | http://localhost:8081 (`make dev-web`) |

## Comptes

Les comptes de démo n'existent que sur la stack locale, chargés par `make supabase-reset`. Mot de passe commun : `Password123!`. Le détail est dans [demo-accounts.md](../../development/demo-accounts.md).

| Compte | Rôle dans la démo |
| --- | --- |
| Bob (`bob@zumik.dev`) | Compte principal, téléphone A |
| Patrick (`patrick@zumik.dev`) | Ami de Bob, collaborateur de « Jellyfishing Jams », téléphone B |
| Carlo (`carlo@zumik.dev`) | Profil réservé aux amis alors qu'il n'en a aucun : montre la confidentialité |
| Mme Puff (`mrspuff@zumik.dev`) | Compte isolé, sans ami : montre les refus |
