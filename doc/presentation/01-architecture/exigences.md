# III. Architecture et expérience mobile

## Ce que dit le sujet

> *"There is no constraint as to strategies or language you must use for the back-end: you will have to evaluate the benefits and disadvantages of the different available technologies and identify the ones that will suit the project best. You will have to justify your decisions."* (III.1)

> *"You cannot commit libraries you would not have written yourself in your repo. Your project's dependencies must be automatically downloadable from a clone of your repo thanks to a Makefile or similar mechanisms."* (III.1)

> *"The mobile application must allow the user to perform all necessary actions related to the project. It can be implemented either for Android or iOS, using the technology of your choice."* (III.2)

> *"Warning the SDK you choose must not do your work."* (II)

## Ce qu'on livre

- **Backend** : Node.js 22, Express et TypeScript. **Données** : Supabase (PostgreSQL et Auth). **État partagé et anti-abus** : Redis. **Temps réel** : Socket.io.
- **App** : Expo React Native en build Android natif. La même base de code sert le client web du bonus V.1.
- **Chaque choix est justifié** face à des alternatives nommées, dans [decisions.md](../../decisions.md) (§1 pour la stack, §2 pour les choix d'ingénierie).
- **Rien de tiers n'est commité** : tout s'installe avec `make install` à partir de `package.json` et des lockfiles.
- **Le cœur du travail est écrit dans le projet** : concurrence des playlists (rangs fractionnaires en SQL, fonctions Postgres), droits, délégation par appareil, décodage iBeacon. Les SDK servent à la connexion Google/Facebook, à la lecture SoundCloud et au transport.

## Où regarder

- Vue d'ensemble : [architecture/overview.md](../../architecture/overview.md)
- Organisation du code : [architecture/code-layout.md](../../architecture/code-layout.md)
- Choix techniques : [decisions.md](../../decisions.md)

## Écarts assumés

- **iOS** n'est pas livré : le sujet accepte *"either for Android or iOS"*.
