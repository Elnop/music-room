# Choix Techniques et Justifications Architecturales

Ce document consigne et justifie l'ensemble des choix technologiques et architecturaux du projet **Music Room** (Zumik), conformément aux exigences du sujet 42 (v5.3) et aux décisions d'ingénierie de l'epic de refactorisation globale (#362, alimentant l'issue #97).

Chaque décision est confrontée à des alternatives identifiées, en explicitant les raisons techniques de leur rejet.

---

## 1. Choix de la Stack Centrale (Socle Technique)

### 1.1 Environnement et Langage : Node.js (v22 LTS), Express & TypeScript

- **Décision retenue** : Node.js 22 LTS, framework HTTP Express, langage TypeScript en mode strict (`noImplicitAny`, validation stricte des types).
- **Justification** :
  - **Maturité et prévisibilité** : Express dispose d'un écosystème mature, stable et sans magie, parfaitement adapté à une architecture modulaire en couches.
  - **Homogénéité TypeScript** : Utiliser TypeScript à la fois sur le backend et sur l'application mobile permet une cohérence sémantique totale, un partage des types de domaine et une détection immédiate des régressions de contrat à la compilation.
  - **Adéquation avec Node 22** : Support natif des modules ES, performances optimisées du moteur V8 et compatibilité avec l'ensemble des conteneurs de la CI.
- **Alternatives étudiées et rejetées** :
  - *NestJS* : Rejeté pour sa complexité accidentelle (inversion de contrôle lourde, surabondance de décorateurs et de métadonnées, abstraction excessive masquant le fonctionnement HTTP sous-jacent et rigidifiant les tests).
  - *Fastify* : Rejeté en raison de son écosystème de middlewares moins universel et de frictions d'intégration avec l'adaptateur Socket.io et les middlewares de sécurité standard.
  - *Go ou Python (FastAPI)* : Rejetés car introduisant une rupture de pile technologique avec l'application mobile (React Native), empêchant la mutualisation des compétences et l'unification des garde-fous.

---

### 1.2 Base de Données et Identité : Supabase (PostgreSQL, Auth & Row Level Security)

- **Décision retenue** : PostgreSQL managé via Supabase, migrations SQL versionnées et séquentielles (`backend/migrations/NNN_*.sql`), client officiel `@supabase/supabase-js` strictement réservé au backend (gestion administrative et vérification de session).
- **Justification** :
  - **Richesse relationnelle** : PostgreSQL garantit l'intégrité relationnelle et transactionnelle (ACID) indispensable pour les playlists, l'ordonnancement des pistes, les permissions de collaboration et les relations d'amitié.
  - **Authentification robuste** : Supabase Auth gère de façon sécurisée le hachage des mots de passe, les flux OAuth (Google, Facebook) et la gestion des tokens JWT.
  - **Environnement local et CI reproductible** : Possibilité de faire tourner la stack complète Supabase en local via Docker (`scripts/test-db.sh`, `make supabase-up`), rendant les tests d'intégration 100% autonomes et déconnectés d'Internet.
- **Alternatives étudiées et rejetées** :
  - *PostgreSQL nu auto-hébergé* : Rejeté car nécessitant de recréer manuellement toute la couche de gestion d'utilisateurs, de sessions OAuth et d'infrastructure d'administration.
  - *Firebase / Google Cloud Firestore* : Rejeté car modèle NoSQL inadapté aux contraintes de tri strict, de transactions complexes et de relations n-à-n du sujet (amitiés, droits sur playlists), en plus du verrouillage propriétaire (vendor lock-in).
  - *MongoDB* : Rejeté pour l'absence de garanties d'intégrité référentielle native et le surcoût de modélisation pour des structures fortement relationnelles.

---

### 1.3 Gestion d'État Distribué, Cache et Anti-Abus : Redis

- **Décision retenue** : Redis 7 via le client `ioredis`, dédié à l'état temps réel, aux limitations de débit (rate limiting), à la révocation des tokens JWT et à la synchronisation concurrente des files de lecture.
- **Justification** :
  - **Performances en mémoire sub-milliseconde** : Traitement instantané des compteurs anti-abus et des verrous de concurrence.
  - **Opérations atomiques multi-clés** : Les pipelines et scripts Redis garantissent que l'incrémentation des fenêtres glissantes et les modifications d'état s'exécutent de façon strictement atomique sans race conditions.
  - **Aucun repli en mémoire** : Conforme aux exigences du sujet et de l'architecture distribuée : en cas d'indisponibilité Redis, le service échoue de façon contrôlée sans dégrader la sécurité par un fallback in-memory localisé à un seul conteneur.
- **Alternatives étudiées et rejetées** :
  - *Memcached* : Rejeté en raison de son absence de structures de données riches (hashes, sets ordonnés), de mécanismes atomiques avancés et d'expiration fine.
  - *RabbitMQ / Apache Kafka* : Rejetés car conçus pour le streaming et le message queuing persistant à très grande échelle ; disproportionnés et inadaptés aux besoins de compteurs éphémères et de stockage de session clé-valeur.
  - *État en mémoire du processus Node.js* : Formellement interdit : rendrait le backend incapable de passer à l'échelle (scale-out) et provoquerait une perte d'état et des failles de sécurité lors des redémarrages de pods/conteneurs.

---

### 1.4 Communication Temps Réel : Socket.io

- **Décision retenue** : Socket.io (WebSocket avec secours HTTP long-polling), authentification par JWT lors du handshake, découpage événementiel par domaine (`listening`, `playlist`, `control`).
- **Justification** :
  - **Gestion native des salles (rooms)** : Permet d'isoler les diffusions aux seuls membres d'une playlist collaborative ou aux participants d'une session d'écoute.
  - **Résilience réseau sur mobile** : Gestion native des reconnexions transparentes, du backoff exponentiel et des buffers d'événements lors des transitions réseau (Wi-Fi ↔ 4G/5G).
  - **Accusés de réception (acknowledgements)** : Confirmation bidirectionnelle immédiate des actions (ex. délégation de contrôle de lecture, ajout à la file).
- **Alternatives étudiées et rejetées** :
  - *WebSockets natifs (bibliothèque `ws`)* : Rejetés car nécessitant de réimplémenter entièrement la gestion des rooms, le heartbeat, les mécanismes de reconnexion, le fallback transport et la sérialisation d'événements.
  - *Server-Sent Events (SSE)* : Rejetés car unidirectionnels (serveur vers client uniquement) ; inaptes à supporter les commandes de télécommande musicale émises par le mobile vers le serveur.
  - *HTTP Long-Polling brut* : Rejeté en raison de la latence excessive, de l'overhead d'en-têtes HTTP à chaque requête et de l'inadéquation avec une synchronisation audio fine.

---

### 1.5 Framework Mobile : Expo React Native (Build Natif Android)

- **Décision retenue** : Expo SDK 52 / React Native 0.76 compilé sous forme de build natif Android (`npx expo run:android`), sans passer par Expo Go.
- **Justification** :
  - **Accès natif complet et performances** : La compilation native permet d'intégrer les modules natifs requis par le sujet (Google Sign-In natif, Facebook SDK, extraction de palettes de couleurs d'artwork `react-native-image-colors`).
  - **Outillage Expo moderne** : Gestion unifiée des assets, de la configuration (`app.json`), des plugins de configuration (`plugins/`) et de la génération des manifests Android sans les lourdeurs de maintenance manuelle des projets Gradle.
- **Alternatives étudiées et rejetées** :
  - *Expo Go* : Rejeté car techniquement incapable de faire tourner l'application : les bibliothèques d'authentification tierces et d'analyse d'images nécessitent du code natif personnalisé absent du client Expo Go précompilé.
  - *Bare React Native (sans Expo)* : Rejeté en raison de la complexité inutile de gestion des versions de dépendances natives et des scripts de build manuels sans gain de fonctionnalité.
  - *Flutter (Dart)* : Rejeté pour maintenir l'homogénéité TypeScript dans toute la codebase, permettant le partage des interfaces de réponse API et des règles d'ingénierie communes.
  - *Développement natif pur (Kotlin/Swift)* : Rejeté en raison du coût de développement et de maintenance doublé pour une équipe restreinte, sans valeur ajoutée pour une application de streaming/télécommande musicale.

---

### 1.6 Protocole d'Échange : REST & JSON

- **Décision retenue** : Architecture RESTful, payloads au format JSON, utilisation stricte des codes de statut HTTP standardisés (200, 201, 204, 400, 401, 403, 404, 409, 429, 500) et enveloppe d'erreur unifiée (`ApiError` / `AppError`).
- **Justification** :
  - **Interopérabilité universelle** : Tout client HTTP ou outil d'inspection (Postman, curl, Swagger UI) interagit directement avec l'API.
  - **Mise en cache et contrôle réseau** : Les middlewares de rate limiting et d'authentification s'appliquent naturellement par méthode et URI.
- **Alternatives étudiées et rejetées** :
  - *GraphQL* : Rejeté en raison de la complexité de mise en cache HTTP standard, de l'absence de rate limiting granulaire par endpoint, de la vulnérabilité aux requêtes récursives complexes (DoS) et de l'inutilité de la sélection de champs pour le volume de données du projet.
  - *gRPC / Protobuf* : Rejeté car les charges utiles binaires rendent l'inspection manuelle difficile et s'intègrent mal avec Swagger UI, requis pour la démonstration et l'évaluation du sujet.
  - *tRPC* : Rejeté pour préserver l'indépendance stricte du backend en tant qu'API publique documentée via OpenAPI, consommable par n'importe quel client externe.

---

## 2. Choix d'Ingénierie de l'Epic de Refactorisation (#362)

### 2.1 Gestion des Données Serveur Côté Mobile : TanStack Query (React Query)

- **Décision retenue** : TanStack Query v5 pour l'ensemble des données issues du réseau (requêtes, mutations, cache, déduplication, états `isPending`/`isError`). Zustand est strictement cantonné à l'état client local éphémère (session utilisateur, réglages UI, état du lecteur).
- **Justification** :
  - **Séparation nette de l'état serveur vs état client** : Les données distantes sont asynchrones, sujettes à expiration et partagées ; les mélanger dans un store client global engendre des bugs d'invalidation et des états obsolètes.
  - **Synchronisation fine avec Socket.io** : Via l'utilitaire `socketCache.ts`, les événements temps réel mettent à jour chirurgicalement le cache (`queryClient.setQueryData`) ou invalident les requêtes de façon atomique.
- **Alternatives étudiées et rejetées** :
  - *Zustand pour tout* : Rejeté car oblige à réécrire manuellement la gestion des états de chargement, les tentatives de rejeu (retries), la déduplication des requêtes simultanées et le garbage collection du cache mémoire.
  - *Redux Toolkit (RTK Query)* : Rejeté pour son surpoids conceptuel, son boilerplate verbeux et son couplage rigide à un dispatcher global.
  - *SWR* : Rejeté car son modèle de mutation et de gestion des profils de cache est moins puissant et moins extensible que TanStack Query (notamment pour l'intégration avec Socket.io).

---

### 2.2 Styles et Conception Visuelle : StyleSheet & Tokens de Thème

- **Décision retenue** : `StyleSheet.create` de React Native combiné à des tokens stricts (`theme.colors.*`, `theme.typography.*`, `theme.spacing.*`) définis dans `src/shared/theme/`, imposés par la règle ESLint `guardrails/theme-tokens`.
- **Justification** :
  - **Dynamisme multi-thèmes** : L'application supporte 4 thèmes complets basculables instantanément sans redémarrage.
  - **Performance native** : `StyleSheet` garantit l'envoi direct des styles au pont natif sans recalcul CSS à l'exécution.
  - **Zéro valeur magique** : Règle bloquante interdisant les couleurs brutes codées en dur hors des fichiers de définition de thème.
- **Alternatives étudiées et rejetées** :
  - *NativeWind (Tailwind CSS pour React Native)* : Rejeté en raison de son incompatibilité avec un basculement dynamique et fluide de thèmes complets à chaud sans recompilation des classes utilitaires.
  - *Styled-components / Emotion* : Rejeté en raison de l'empreinte mémoire élevée et du ralentissement des rendus consécutif à l'injection dynamique d'arbres de styles CSS-in-JS.
  - *Styles inline libres* : Rejeté car source d'incohérences graphiques majeures et de fuites de performances (nouvel objet alloué à chaque re-render).

---

### 2.3 Navigation Mobile : React Navigation v7

- **Décision retenue** : React Navigation avec typage strict TypeScript (`RootStackParamList`, `NavigationProp`), organisation hiérarchique en stacks par domaine fonctionnel et liaisons d'écrans limitées à des orchestrateurs.
- **Justification** :
  - **Contrôle précis du cycle de vie** : Gestion fine des transitions, de l'état d'animation et de l'historique de navigation sur Android.
  - **Découplage navigation / présentation** : Un écran n'importe qu'un composant orchestrator, garantissant que la navigation reste un simple aiguilleur sans logique métier directe.
- **Alternatives étudiées et rejetées** :
  - *Expo Router* : Rejeté car impose une arborescence basée sur les fichiers (`app/`) qui entre en conflit direct avec le découpage par feature-slice (`src/features/<feature>/<subject>`), en plus d'introduire des comportements implicites difficiles à maîtriser dans des flux d'authentification conditionnels stricts.

---

### 2.4 Documentation OpenAPI Backend Générée depuis les Schémas Zod

- **Décision retenue** : Schémas Zod uniques pour la validation d'entrée HTTP et l'inférence des types TypeScript (`z.infer`), couplés à `@asteasolutions/zod-to-openapi` pour la génération automatique de la documentation Swagger UI (`/api-docs`).
- **Justification** :
  - **Source unique de vérité (Single Source of Truth)** : Impossible d'avoir une divergence entre le validateur d'exécution (Zod), les types TypeScript de compilation et la documentation OpenAPI exposée aux consommateurs.
  - **Conformité stricte au sujet** : Le sujet v5.3 valide explicitement une documentation OpenAPI auto-générée si elle décrit fidèlement méthodes, paramètres et codes de réponse.
- **Alternatives étudiées et rejetées** :
  - *Spécification OpenAPI / Swagger écrite manuellement (YAML/JSON)* : Rejetée en raison du risque inévitable de désynchronisation rapide avec l'implémentation lors des évolutions du code.
  - *tsoa ou décorateurs NestJS* : Rejetés car ils imposent une écriture orientée objet avec classes et décorateurs TypeScript expérimentaux, contraire à la règle de modularité en fonctions pures.

---

### 2.5 Architecture Interne Backend : Modules de Fonctions Pures

- **Décision retenue** : Abandon complet des classes instanciées en singleton au profit de modules TypeScript exportant des fonctions pures (`services/<nom>.service.ts`), importés sous forme de namespaces (`import * as authService from ...`).
- **Justification** :
  - **Lisibilité et testabilité** : Les fonctions pures prennent leurs dépendances en paramètres ou font appel à des utilitaires partagés sans état interne caché, simplifiant drastiquement les mocks dans Vitest.
  - **Tree-shaking et légèreté** : Élimination du boilerplate des constructeurs et des conteneurs d'injection de dépendance inutiles.
- **Alternatives étudiées et rejetées** :
  - *Classes avec injection de dépendance (type Inversify / Nest)* : Rejeté car complexifie le code sans aucun bénéfice tangible pour une application de cette taille.

---

### 2.6 Garde-fous et Qualité Intransigeante (`npm run check`)

- **Décision retenue** : Commande `npm run check` unifiée dans chaque projet (backend et mobile), exécutée en pre-commit via Husky et dans la CI GitHub Actions, articulée autour de 10 vérificateurs parallèles :
  1. `type-check` (`tsc --noEmit`) : Vérification stricte des types.
  2. `lint` (ESLint 9 Flat Config + plugin maison `components`) : Respect des rôles de composants, interdiction de `console.*`, imports relatifs parents interdits (`@/` obligatoire), un seul composant par fichier.
  3. `check:dead-code` (`knip`) : Détection et élimination du code mort (fichiers, exports, types et dépendances orphelines).
  4. `check:deps` (`dependency-cruiser`) : Interdiction des cycles, validation des couches logiques et étanchéité inter-features.
  5. `check:duplication` (`jscpd`) : Contrôle strict de la duplication de code (seuil 0 clone toléré).
  6. `check:semgrep` & `check:ast-grep` : Détection de motifs anti-patterns (interdiction des appels directs à `fetch` ou d'accès à AsyncStorage hors modules autorisés).
  7. `check:secrets` (`gitleaks` via Docker) : Blocage absolu de toute fuite de token, clé API ou secret.
  8. `test` (Vitest backend, Jest-Expo mobile) : Exécution de l'intégralité des suites de tests unitaires et d'intégration.
  9. `check:exceptions` : Vérification que les listes d'exceptions n'augmentent jamais et tendent vers zéro.
- **Justification** :
  - **Politique append-only** : Aucune règle ne peut être désactivée ou passée en "warning" pour faire passer du code.
  - **Autonomie de l'équipe et des agents IA** : Les garde-fous fournissent un retour immédiat et univoque sur toute tentative de régression architecturale.
- **Alternatives étudiées et rejetées** :
  - *Vérification manuelle en revue de code seule* : Rejetée car faillible, chronophage et incapable d'assurer la constance des critères sur des dizaines de PRs successives.
  - *Tolérance de suppressions permanentes (eslint-disable laxistes)* : Rejetée car transforme progressivement les règles de qualité en vœux pieux.
