# Scénario : chaque action de l'app est journalisée

**Prouve** : IV.6, *"Any action on the mobile application must generate logs on the back-end. Platform [...], Device [...], Application Version."*

**Prérequis** : `make logs-backend` ouvert dans un terminal, téléphone A connecté en Bob, et le client web (`make dev-web`) en option.

| # | Action | Résultat attendu | ☐ |
| --- | --- | --- | --- |
| 1 | A : ouvrir une playlist | Une ligne `HTTP Request` avec `platform: android`, `device` (le modèle du téléphone) et `appVersion` ; puis `HTTP Response` avec `userId`, `status` et le temps de réponse | ☐ |
| 2 | A : ajouter un titre | Une ligne pour l'appel HTTP et une pour l'événement socket, avec les mêmes informations d'appareil | ☐ |
| 3 | A : se connecter, se déconnecter | Les appels d'authentification sont journalisés eux aussi : l'app n'a aucun client Supabase, tout passe par le backend | ☐ |
| 4 | Même action depuis le navigateur | `platform: web` | ☐ |
| 5 | **Profil** : la version affichée en bas (`Zumik <version> (build …)`) | C'est la même que `appVersion` dans les logs | ☐ |

**À dire** : un seul client HTTP (`mobile/src/shared/services/api.ts`) ajoute les en-têtes. Une règle semgrep interdit d'appeler `fetch` en dehors de ce client, donc aucune action ne peut échapper aux logs.
