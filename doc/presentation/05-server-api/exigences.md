# IV.3 Serveur, IV.4 API, IV.5 Application mobile

## Ce que dit le sujet

> *"All the service data will be stored on the back-end side. The back-end is the reference. It is the keeper and representative of the "truth"."* (IV.3)

> *"This API reference documentation must introduce methods, inputs and outputs. It can be self-generated with Swagger, for instance."* (IV.4)

> *"You should create an API that endorses the principle of REST [...] you will have to be able to justify your choice and explain its characteristics."* et *"You should endorse JSON for your exchange format [...]"* (IV.4)

> *"Applications must only be "remote control" to the back-end and the back-end's address must be configurable on the application for tests."* (IV.5)

> *"Authentication support through a social network like Facebook or Google must be implemented in the mobile application."* (IV.5)

## Ce qu'on livre

- **Le backend est la référence** : toutes les données sont dans Supabase (PostgreSQL), et seul le backend y accède. Depuis #201, la base refuse tout accès direct avec la clé anon ; depuis #376, l'app ne contient plus aucun client Supabase.
- **API REST et JSON documentée par Swagger UI** (`/api-docs`). Pour chaque route, on y trouve la méthode, les paramètres, le corps, les réponses et les erreurs.
- **Une documentation qui ne peut pas diverger du code** : elle est générée à partir des schémas Zod qui valident les requêtes. Un test (`openapi-coverage.test.ts`) échoue dès qu'une route montée n'est pas documentée.
- **Erreurs uniformes** : un seul format d'erreur, `{ success: false, error: { message, code, why, fix } }`, et toute entrée invalide reçoit `400 VALIDATION_ERROR`.
- **L'app est une télécommande** : chaque appel HTTP passe par `shared/services/api.ts`, et les événements Socket.io mettent à jour son cache. Elle ne garde aucune donnée métier en propre.
- **Adresse du backend modifiable dans l'app**, sans rebuild : le champ **Serveur** des Paramètres, ou l'écran d'accueil avant la connexion.
- **Google et Facebook** dans l'app : voir [02-user/scenario-social-login.md](../02-user/scenario-social-login.md).

## Justifier REST et JSON

L'argumentaire complet est dans [decisions.md §1.6](../../decisions.md#16-protocol-rest-and-json). En résumé :

- les ressources (playlists, titres, appareils, file d'attente) se prêtent bien à REST ;
- les statuts HTTP portent les cas métier (`403`, `404`, `409` de concurrence) ;
- JSON est natif côté Node et React Native, et lisible dans Swagger UI ;
- le temps réel passe par Socket.io, à côté de l'API et non à sa place.

## Où regarder

- `backend/src/app/routes.ts`, `backend/src/app/openapi.ts`, `backend/src/features/*/<name>.openapi.ts`
- `mobile/src/shared/services/api.ts`, `mobile/src/shared/services/backendUrl.ts`
- Détail : [mobile-api.md](../../features/mobile-api.md)

## Scénarios

- [scenario-swagger.md](scenario-swagger.md) : la documentation et un appel réel
- [scenario-backend-url.md](scenario-backend-url.md) : changer l'adresse du backend dans l'app
