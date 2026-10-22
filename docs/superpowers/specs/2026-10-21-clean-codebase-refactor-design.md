# Codebase propre : refactor global, code mort, architecture et garde-fous

Date : 2026-10-21 · Epic : #362 · Modèles : [bedrock](https://github.com/JCluzet/bedrock) (principes) et [VibeAppTemplate](https://github.com/JCluzet/VibeAppTemplate) (déclinaison React Native)

## Objectif

Rendre la codebase (backend et mobile) la plus propre possible, sans ajouter de fonctionnalité :

1. **Zéro code mort** : fichiers, exports, types, dépendances, logs et TODO périmés.
2. **Une seule façon de faire chaque chose** : même architecture dans toutes les features, sens des dépendances unique, rôles des composants clairs.
3. **Moins de code, plus lisible** : moins de lignes là où c'est rentable, et un code qu'un nouveau venu ou le correcteur 42 comprend vite.
4. **Des garde-fous qui bloquent** : une commande `check` par projet, en pre-commit et en CI, empêche la dérive après l'epic.

C'est une priorité, sans échéance : on va jusqu'au bout plutôt que de s'arrêter au plus rentable.

## Contraintes

- **Le sujet v5.3 (`doc/en.subject.pdf`) fait foi**, au-dessus de tout le reste, y compris de l'objectif de réduction du volume.
- **Aucune régression** : le comportement visible de l'app ne change pas (seul écart toléré : les opacités au toucher harmonisées, voir « Primitives »).
- **CI verte à chaque PR**, une branche et une PR par story vers `develop`, comme le prévoit AGENTS.md.
- Les règles d'AGENTS.md restent valables (pas de barrel `index.ts`, Zod partout, pas de `any`, pas de SDK qui fait le travail du sujet, dépendances installées depuis les manifestes). Celles que ce refactor change sont mises à jour dans AGENTS.md par la story qui les change.
- La couverture de tests ne baisse pas.

## Non-objectifs

- Pas de nouvelle fonctionnalité, pas de refonte visuelle ni de changement de parcours utilisateur.
- Pas de changement de stack de base : Express, Supabase, Redis, Socket.io et Expo restent.
- Pas de Music Track Vote (IV.2.1).

## Décisions techniques (arbitrées)

| Sujet | Décision | Écarté |
|---|---|---|
| Données serveur côté mobile | **TanStack Query** ; Zustand ne garde que l'état client (session, lecteur, préférences, UI) | Zustand pour tout |
| Styles mobile | **StyleSheet conservé** ; couleurs, espacements et typographies uniquement via les tokens de thème, imposé par lint | NativeWind |
| Navigation mobile | **React Navigation conservé** | Expo Router |
| Gestion d'erreurs mobile | Exceptions typées (`ApiError`), gérées par TanStack Query | Pattern `Result<T>` |
| Gestionnaire de paquets | **npm** (Makefile, Dockerfiles, CI inchangés) | bun |
| Doc API backend | **Générée depuis les schémas Zod** (le sujet autorise une doc auto-générée ; elle garde méthodes, entrées et sorties) | `*.openapi.ts` écrits à la main |
| Style du code backend | **Modules de fonctions exportées** ; plus de classes instanciées une seule fois | Classes |
| Tests | **Ils suivent le code** : déplacés et réécrits avec lui, ceux du code mort supprimés, doublons fusionnés | Filet seulement |
| Primitives d'interaction | **`Pressable` et `Button` maison** dans `shared/components/ui/` ; lint interdit `TouchableOpacity` et `Pressable` de `react-native` ailleurs | Primitives libres |
| Garde-fous | knip, dependency-cruiser, jscpd, plugin ESLint maison, semgrep et ast-grep, scan de secrets, husky | — |
| Activation des garde-fous | **Bloquants dès la mise en place, avec une liste d'exceptions qui ne peut que diminuer** | Activation règle par règle |

## Architecture cible

### Principes communs (repris de bedrock)

- **Sens des dépendances unique**, vérifié par dependency-cruiser, sans cycle.
- **Pas d'import d'une feature vers une autre** : ce qui est partagé monte dans `shared/`.
- **`@/` obligatoire** pour tout import qui sort du dossier courant ; pas de `../`.
- **150 lignes maximum** par fichier source (service, composant, hook, store), tests exclus.
- **Règles append-only** : chaque règle a sa section dans `.agents/rules/<sujet>.md`, son message d'erreur pointe vers cette section, et on ne désactive ni n'affaiblit jamais une règle pour faire passer du code. AGENTS.md référence ces fichiers dans une table « quand lire quoi ».
- **Logs structurés** : un logger par projet, plus de `console.*` direct (lint). Niveaux `error`, `warn`, `info`, `debug` au sens de bedrock (`logging.md`).
- **Format d'erreur unique** : une erreur porte un statut HTTP, un message affichable, une explication technique et, si possible, une piste de correction. Le backend renvoie ce format, et le mobile le lit dans `ApiError`.

### Backend

```
backend/src/
├── server.ts
├── app/                      <- racine de composition (#375) : routes.ts, openapi.ts ; seul server.ts l'importe
├── realtime/
│   ├── socket-server.ts      <- création du serveur, auth, branchement des handlers (pas d'index.ts)
│   ├── handlers/             <- un fichier par domaine : playlist, listening, control
│   └── emitters/             <- notify* / sendDeviceCommand, importés par les features
├── features/<name>/
│   ├── <name>.routes.ts
│   ├── <name>.openapi.ts     <- enregistrement OpenAPI à partir des schémas Zod
│   ├── <name>.controller.ts
│   ├── <name>.validators.ts  <- schémas Zod ; les types d'entrée en sont inférés
│   ├── <name>.types.ts       <- types de réponse et de domaine seulement
│   ├── services/             <- toute la logique ; plus de <name>.service.ts à la racine
│   ├── permissions/
│   └── utils/
└── shared/                   <- config, middleware, logger, erreurs, sécurité ; n'importe jamais une feature
```

- `routes → controller → services → shared`.
- Les DTO écrits en double des schémas Zod disparaissent au profit de `z.infer`.
- **Anti-abus regroupé** : `brute-force.service`, `rate-limiter.service`, `rate-limit.middleware`, `token-verify-limiter`, `account-lockout`, `password-reset-cooldown` et `event-rate-limit` deviennent un seul module (dans `shared/`) avec une seule API Redis, toujours sans repli en mémoire.
- **Ce qui ne change pas** : les endpoints, les formats de réponse (sauf le format d'erreur, harmonisé et répercuté dans `mobile/src/types/`), les noms d'événements Socket.io et les migrations.

### Mobile

```
mobile/src/
├── navigation/               <- React Navigation ; un écran n'importe qu'un orchestrator
├── providers/                <- QueryClientProvider, thème, etc. (définitions)
├── features/<feature>/
│   ├── <subject>/
│   │   ├── components/
│   │   │   ├── orchestrators/  <- branchent hooks et stores, choisissent le presenter
│   │   │   └── presenters/     <- props en entrée, JSX en sortie ; ni état, ni effet, ni store
│   │   └── hooks/              <- logique et état ; jamais de JSX ; interface de retour explicite
│   ├── hooks/                  <- hooks de requête TanStack de la feature
│   ├── services/               <- appels HTTP de la feature, via le client partagé
│   ├── stores/                 <- stores Zustand propres à la feature (état client)
│   └── types.ts
└── shared/
    ├── components/ui/          <- primitives : Pressable, Button, Input, Text…
    ├── components/<subject>/   <- blocs partagés entre features
    ├── services/               <- client API (api.ts : en-têtes X-Platform…), socket, stockage
    ├── query/                  <- QueryClient, fabrique de clés, profils de cache nommés
    ├── stores/                 <- stores transverses (session, thème…)
    ├── hooks/ · utils/ · types/ · theme/ · logger
```

- Features visées : auth, playlists, player, queue (avec Connect et transfert de lecture), friends, profile, music-control, search.
- Les stores de feature restent dans leur feature (écart assumé avec VibeAppTemplate, qui les met tous dans `shared/stores/`), car `queueStore` ou `connectStore` portent du métier.
- **TanStack Query et Socket.io** : les hooks de requête lisent l'API ; un événement Socket.io met à jour le cache (`setQueryData`) ou l'invalide via la fabrique de clés. Le contrôle de version de la queue (#285, rejet des états périmés) est conservé.
- **Lecteur** : une seule source de vérité. `PlayerContext` (635 lignes) et `playerStore` fusionnent en un store client et des hooks ; le contexte ne sert plus qu'à l'injection si besoin.
- **Thèmes** : les 4 thèmes existants restent ; les tokens restent la seule source de couleurs.
- **Primitives** : le `Pressable` maison fixe l'opacité, le retour haptique et le rôle d'accessibilité, avec un `accessibilityLabel` obligatoire dans son type. Les gestes (swipe, drag & drop, mini-player) restent sur `react-native-gesture-handler`.

## Conformité au sujet

Écart trouvé pendant l'audit : le mobile embarque un client Supabase (`mobile/src/lib/supabase.ts`) et s'authentifie directement auprès de Supabase (`authStore.ts`, `signInWithPassword`, `setSession`, `signOut`, `onAuthStateChange` dans `RootNavigator.tsx`). Le sujet veut une app « remote control » du backend, qui est la référence, et des logs backend pour toute action du mobile. Cible : toute l'authentification passe par l'API backend, et `@supabase/supabase-js` disparaît du mobile.

## Garde-fous

Chaque projet (`backend/`, `mobile/`) a un `npm run check` qui lance en parallèle :

| Check | Outil | Rôle |
|---|---|---|
| type-check | tsc | — |
| lint | ESLint et plugin maison | rôles des composants, pas de barrel, `@/` obligatoire, pas de `console`, primitives, tokens, sélecteurs Zustand… |
| dead-code | knip | fichiers, exports, types, dépendances inutilisés |
| deps | dependency-cruiser | sens des couches, pas d'import entre features, pas de cycle |
| duplication | jscpd | duplication de code |
| patterns | semgrep et ast-grep | règles par motif que le lint couvre mal |
| secrets | scanner de secrets | aucune clé committée |
| test | Vitest / jest-expo | — |

- husky lance `check` en pre-commit. La CI le lance sur chaque PR vers `develop` et garde ses jobs actuels (dont `test:int`).
- Les outils sont des devDependencies installées par `make install`.
- **Liste d'exceptions** : un fichier versionné par outil liste les fichiers encore non conformes. Une story qui migre une zone retire ses entrées. Un script vérifie que la liste ne grandit jamais par rapport à `develop`. Elle doit être vide à la fin de l'epic.

## Découpage de l'epic

L'ordre est imposé ; une story = une branche = une PR vers `develop`.

**Phase 0, fondations**
1. Supprimer le code mort des deux côtés (rapport knip de l'audit), y compris `axios`, `expo-secure-store`, `react-native-swipeable-item`, `expo-web-browser` et les devDependencies inutiles. Ajouter les dépendances non déclarées (`expo-constants`). Retirer `lodash` et `uuid` s'ils se remplacent en quelques lignes. Supprimer les `console.log` et `TODO` périmés.
2. Mettre en place `check` (tous les outils, liste d'exceptions, husky, CI) et `.agents/rules/`, référencés depuis AGENTS.md.
3. Logger structuré et format d'erreur unique, backend et mobile.

**Phase 1, backend**

4. OpenAPI générée depuis Zod, pour toutes les features.
5. Passage aux fonctions et layout uniforme, une story par feature : auth, playlists, profile, queue, music-control, friends, soundcloud et mail. Inclut la limite de 150 lignes et les types tirés de `z.infer`.
6. Un seul module anti-abus.
7. `realtime/` découpé par domaine.

**Phase 2, mobile**

8. Authentification entièrement via le backend ; suppression de Supabase côté mobile.
9. Socle : arborescence `features/` et `shared/`, primitives `ui/`, TanStack Query (provider, fabrique de clés, profils de cache, branchement Socket.io), logger.
10. Migration feature par feature, une story chacune : auth, playlists, player, queue et Connect, friends, profile, music-control, search. Chaque story couvre la structure orchestrator/presenter/hook, le passage à TanStack Query, les primitives et les tests.
11. Plugin ESLint maison des rôles de composants, sans exception restante.

**Clôture**

12. Mettre à jour README, `backend/README.md`, `mobile/README.md`, AGENTS.md et `doc/`, et rédiger la justification des choix techniques (alimente #97). Vérifier que toutes les listes d'exceptions sont vides.

## Critères de fin d'epic

- `npm run check` vert dans `backend/` et `mobile/`, sans aucune exception listée.
- `make test` et la CI verts ; couverture au moins égale à celle d'avant l'epic.
- Plus aucun fichier source au-delà de 150 lignes (hors `supabase.generated.ts`).
- Parcours manuel sur build natif Android : connexion (mot de passe, Google, Facebook), playlists (édition, partage), lecture, queue et Connect, délégation, amis, profil. Comportement identique à avant.
- Swagger UI complet (méthodes, entrées, sorties) pour tous les endpoints.

## Choix faits pendant la rédaction (à valider)

- **Fichiers OpenAPI** : `<name>.openapi.ts` reste, mais ne contient plus que l'enregistrement des routes à partir des schémas Zod. Les routes restent ainsi sous 150 lignes, et AGENTS.md change peu.
- **semgrep** demande Python. Il tourne via son image Docker officielle, puisque Docker est déjà requis par `make dev-docker`, et n'ajoute donc rien à installer sur la machine de référence (#103). ast-grep s'installe par npm.
- **Pre-commit** : husky ne lance `check` que dans le ou les projets touchés par le commit, pour garder un commit rapide. La CI lance tout.
- **Couverture de référence** : mesurée et notée dans la story 2 (`vitest --coverage` et `jest --coverage`) avant tout refactor. Elle sert de plancher.
- **Authentification mobile** : le backend expose déjà `/api/auth/login`, `/refresh` et `/logout`, et `api.ts` gère déjà le rafraîchissement. La story 8 retire le client Supabase et branche la session sur ces seuls endpoints, sans nouvel endpoint prévu.
- **Limite de 150 lignes** : s'applique aux fichiers source écrits à la main. Sont exclus les tests, `supabase.generated.ts`, les migrations et les fichiers de configuration.

## Laissé au builder

- Le choix exact des bibliothèques : génération OpenAPI compatible Zod 4, scanner de secrets, logger.
- Les noms précis des règles ESLint et leur répartition entre ESLint, semgrep et ast-grep.
- Le découpage interne de chaque feature en `subject` et le nom des sous-composants.
- Le seuil jscpd de départ (0 visé à la fin, comme bedrock).
- Le format du fichier d'exceptions et le script qui vérifie qu'il diminue.
