# V.2 Réflexion sur l'IoT : événements à proximité

## Ce que dit le sujet

> *"You can implement a mechanism such as IBeacon on your event. For instance, when people get near a public event registered on your service, they automatically receive informations about the event, how to access it, the kind of music etc."*

## Ce qu'on livre

- **Événements physiques publics** enregistrés sur le service : nom, adresse, accès, genres, dates et playlist publique liée (`/api/events`).
- **iBeacon** :
  - le téléphone de l'organisateur émet une trame iBeacon (UUID Zumik, et le minor de l'événement) grâce à un module natif écrit dans le projet (`mobile/modules/beacon-advertiser/`) ;
  - les autres téléphones scannent et décodent la trame **dans le code du projet**, et estiment la distance à partir du RSSI (modèle log-distance, lissé).
- **Réception automatique** : l'événement apparaît tout seul dans « Événements à proximité » sur **Accueil**, avec ses accès, ses genres et sa playlist. Il disparaît de lui-même quand on s'éloigne.
- **GPS en complément** : il trouve les événements dans un rayon autour de soi. Un événement vu à la fois par balise et par GPS ne s'affiche qu'une fois.
- **Vie privée** : le serveur ne reçoit jamais la position, et la distance est calculée sur le téléphone. La balise ne transporte aucune donnée personnelle.

## Où regarder

- [events.md](../../features/events.md)
- `mobile/src/features/events/` (`utils/ibeacon.ts`, `utils/beaconDistance.ts`, `utils/nearbyEvents.ts`), `backend/src/features/events/`

## Scénario

- [scenario.md](scenario.md)

## Écarts assumés

- **Réception au premier plan, sur l'Accueil**, et non par notification en arrière-plan. Cela ménage la batterie et évite la permission de localisation en arrière-plan.
- **Android exige la localisation** (permission et réglage activés) pour remonter les trames iBeacon d'un scan.
- **Music Track Vote n'est pas implémenté** : l'« événement » du bonus est donc un événement physique, à titre informatif.
