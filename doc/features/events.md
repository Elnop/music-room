# Nearby events (iBeacon)

Bonus V.2, "Reflection on the IoT" (epic #476): when people come near a public event registered on Zumik, the app shows it to them on its own, with how to get in and the kind of music. The event is a physical one (party, concert, bar). It is purely informative: no vote and no track queue, since Music Track Vote (IV.2.1) is not implemented; it can link to a public playlist of the Playlist Editor.

Code: `backend/src/features/events/`, migration `032_events.sql`, `backend/src/realtime/emitters/event.emitters.ts`; mobile `src/features/events/` (subjects `nearby/`, `detail/`, `form/`), the native module `mobile/modules/beacon-advertiser/`.

## The event

| Field | Notes |
| --- | --- |
| `name`, `description` | 1–100 and up to 500 characters |
| `address`, `latitude`, `longitude` | Typed address or the creator's current position; the phone turns one into the other (`expo-location`) |
| `accessInfo` | How to get in: entrance, floor, code, transport |
| `genres` | 1 to 5 of the music preference genres (`backend/src/shared/music/genres.ts`) |
| `startsAt`, `endsAt` | The end is after the start, and not already past on creation |
| `playlistId` | Optional; one of the creator's **public** playlists, else 400 `EVENT_PLAYLIST_INVALID`. A linked playlist that turns private comes back as `playlist: null`; a deleted one is unlinked (`ON DELETE SET NULL`) |
| `beaconMinor` | 1–65535, drawn at random by the server among free values, unique over every row: two events never share one |

Every event is public. Any signed-in user creates one; only its creator (the organiser) updates or deletes it (403 `EVENT_ACCESS_DENIED`). Only the backend reads the table (RLS on, privileges revoked, as in migration 017).

| Endpoint | Use |
| --- | --- |
| `GET /api/events` | Ongoing and upcoming events (end not past), by start date, with their coordinates and `beaconMinor` |
| `GET /api/events/:id` | One event, ended or not, with the organiser and the linked playlist |
| `POST /api/events` | Create; 201 with the event |
| `PATCH /api/events/:id` | Organiser only; only the fields sent change, `null` clears an optional one |
| `DELETE /api/events/:id` | Organiser only |
| `GET /api/events/geocode?q=` | Coordinates of a typed address, for the web app, which has no geocoder: the backend asks OpenStreetMap's Nominatim and answers `{ location: { latitude, longitude, displayName } \| null }`. Per user `RATE_LIMIT_GEOCODE_*` (60 per hour), and one Nominatim request per second for the whole backend (`shared/security/upstream-slot.ts`, a Redis key): a request waits up to 3 s for its turn, then gets 429 |

Writes are rate-limited per user (`RATE_LIMIT_EVENTS_*`, 60 per hour). Each write is broadcast to every connected socket: `event:created` and `event:updated` with the whole event, `event:deleted` with `{ eventId }`. The app applies them to its TanStack Query cache (`features/events/utils/eventSocketRules.ts`, mounted once by `useEventsSync`), so lists and pages change without a reload.

## In the app

- **Accueil** opens on « Événements à proximité », above the friends' and public playlists. The section lists the nearby ongoing events, the user's own events (« Vos événements ») and « Créer un événement ».
- **Event page**: when, where, how to get in, genres, organiser, « Ouvrir la playlist ». The organiser also gets « Diffuser la balise », « Modifier » and « Supprimer ».
- **Playlists** tab: only the user's own playlists and those shared with them.

## Detection

Two sources feed the section, both only while the home is shown and the app in the foreground (`useIsFocused` + `AppState`); nothing runs in the background.

### GPS

`expo-location` follows the position (`watchPositionAsync`, balanced accuracy, every 20 m or 10 s). The phone computes the distance to each event of `GET /api/events` with the haversine formula (`features/events/utils/geo.ts`) and keeps the ongoing ones within 300 m (`NEARBY_RADIUS_M`), nearest first, with their distance (« 120 m »). A clock re-checks every 30 s, so an event leaves when it ends.

### iBeacon

The organiser's phone is the beacon. On the page of an ongoing event, « Diffuser la balise » advertises an iBeacon frame until it is turned off, the event ends (`beaconStore` sets a timer) or the app closes:

| Bytes | Value |
| --- | --- |
| Company ID | `0x004C` (Apple), little-endian in the advertisement |
| Type, length | `0x02`, `0x15` |
| UUID | `5a554d49-4b00-4e00-8000-6576656e7473` (Zumik) |
| Major | `1` for every event |
| Minor | the event's `beaconMinor` |
| Measured power | `-59` dBm, the expected RSSI at one metre |

The frame is built in `features/events/utils/ibeacon.ts`. The local Expo module `modules/beacon-advertiser/` (Kotlin, `BluetoothLeAdvertiser`, non-connectable, low latency, high power) only broadcasts the bytes it receives; see [decisions.md](../decisions.md) for why no advertising library was used.

The other phones scan with `react-native-ble-plx`, which only reports advertisements. The project decodes the manufacturer data, keeps frames with Zumik's UUID and major, and matches the minor with `beaconMinor`. The distance comes from the RSSI with the log-distance model, `d = 10^((measuredPower − rssi) / (10 × 2.5))`, on an RSSI smoothed per beacon (exponential average, 0.3); a beacon unheard for 8 s is dropped (`utils/beaconDistance.ts`).

### Fusion

`mergeNearby` (`utils/nearbyEvents.ts`): an ongoing event heard by beacon comes first, as « Tout près », nearest signal first; GPS adds the events in the radius that no beacon announced. An event seen both ways shows once. A beacon is enough on its own: the event shows even when its registered address is far from the phone.

## Privacy

The server sends every event with its coordinates and never receives a position: no endpoint takes one, and the distance is computed on the phone. The beacon carries no personal data, only a public event's minor. Location is foreground only (no background location permission).

## Permissions (Android)

| Permission | When asked | Why |
| --- | --- | --- |
| Location, while in use | « Autoriser la localisation » in the section; « Utiliser ma position actuelle » or saving a typed address in the form | GPS detection; Android's geocoder needs it even for a typed address |
| `BLUETOOTH_ADVERTISE` (Android 12+) | Turning « Diffuser la balise » on | Broadcasting the beacon |
| `BLUETOOTH_SCAN` + fine location (Android 12+) | « Détecter aussi les balises Bluetooth » | Scanning beacons |

`BLUETOOTH_SCAN` is declared **without** `neverForLocation`: with that flag, Android filters advertisements on its location denylist, which covers iBeacon frames, out of the scan results. Scanning therefore needs the location permission and the **location setting on**, like any Android app that reads beacons.

Each refusal is explained where it happens (section message with a button, or a toast), and the rest of the app keeps working: Bluetooth off leaves the GPS alone, a refused location leaves the section with its explanation and « Créer un événement ».

The native parts (`expo-location`, the date picker, `react-native-ble-plx`, `beacon-advertiser`) need the debug build to be rebuilt after pulling them (`mobile/README.md`).

## Demo with two phones

Phone A is the organiser, phone B the visitor; both run the build, signed in with different accounts, Bluetooth on.

1. On A, **Accueil** › « Créer un événement »: a name, an address **in another city** (so B's GPS cannot find it), how to get in (« Bâtiment C, 7e étage »), two genres, a start now and an end in two hours, and one of A's public playlists. « Créer l'événement » opens its page.
2. On A's event page, turn « Diffuser la balise » on; allow « Appareils à proximité ». The card says the nearby phones see the event.
3. On B, open **Accueil** (location allowed and on, as Android requires for any beacon scan; « Détecter aussi les balises Bluetooth » once). Within a few seconds, with no action, the event appears in « Événements à proximité » as « Tout près »: the beacon, since its address is hundreds of kilometres away.
4. On B, tap it: the page shows how to get in and the genres; « Ouvrir la playlist » opens A's playlist.
5. On A, turn « Diffuser la balise » off. On B, back on **Accueil**, the event leaves the section about 8 seconds later.
6. Optional, GPS: on A, edit the event and use « Utiliser ma position actuelle ». With the beacon still off, B shows it with a distance (« 20 m »), then « Tout près » once the beacon is on again: it is listed once.
