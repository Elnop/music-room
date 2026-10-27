# V.1 Multi-plateforme : client web responsive

## Ce que dit le sujet

> *"Once you have a server and a functional API, you can make your services available on various platforms. You should already support a mobile platform (Android or iOS). As a bonus, you could also make your service web "responsive" so it can adapt to any screen size."*

> *"According to your technological choices, web support can require that you rewrite your client code entirely or almost entirely."*

## Ce qu'on livre

- **La même app `mobile/`, compilée pour le navigateur** avec Expo web (`react-native-web`), donc sans réécrire le client. Chaque module natif a sa variante `.web.ts`.
- **Responsive** : téléphone sous 768 px (la mise en page Android), tablette, et bureau à partir de 1024 px (barre latérale, contenu centré, grilles, lecteur ancré, souris et clavier). La mise en page change en direct quand on redimensionne la fenêtre.
- **Le même service** : Playlist Editor en temps réel, et Control Delegation avec le navigateur comme appareil (lecture HLS, touches média). Connexion Google et Facebook, événements par géolocalisation.
- **Backend presque inchangé** : seul `GET /api/events/geocode` a été ajouté. Le navigateur envoie `X-Platform: web`.
- **Mise en ligne** sur GitHub Pages : `https://elnop.github.io/music-room/`. La démo, elle, tourne sur la machine de référence (`make dev-web`).

## Où regarder

- [web-client.md](../../features/web-client.md), [decisions.md §3](../../decisions.md#3-bonus-v1-web-client-epic-474)
- `mobile/src/shared/hooks/useBreakpoint.ts`, `mobile/src/**/*.web.ts`

## Scénario

- [scenario.md](scenario.md)

## Écarts assumés

- **Pas d'iBeacon** : un navigateur ne peut ni émettre ni scanner en Bluetooth LE.
- **Pas de couleurs tirées des pochettes** : le module est natif uniquement.
- **Pas de géocodage inverse** : la position ne quitte pas le navigateur.
- **Jetons en `localStorage`** : risque accepté, M14 de [threat-model.md](../../security/threat-model.md#m14-web-session-tokens-and-third-party-scripts).
