# Music control delegation

Subject IV.2.2 (Music Control Delegation): a user lets friends control their music, with a license specific to each device attached to their account.

Code: `backend/src/features/music-control/`, `backend/src/realtime/handlers/control.handler.ts`, `listening.handler.ts`, `music-control-access.ts`; mobile `src/features/music-control/`.

## Devices

A device is registered every time the app opens its socket: the handshake carries a stable `deviceId`, a name, the platform, the model and the app version, and the backend upserts it in `devices` before accepting the connection. The user sees their devices, with the one in hand marked, in **Profile › My devices** (`features/music-control/myDevices/`) and can rename them (#352).

## Who may control what

Control is always between **mutual friends**. On top of that, the owner grants one of two rights:

- **A license on one device** (`device_control_licenses`): the friend controls that device only. This is the per-device license the subject asks for.
- **The "all my devices" switch** (`follows.can_control_music`): the friend controls every device, present and future. It was kept as a shortcut next to the licenses (decision of 2026-10-05).

The owner always controls their own devices. The rule lives in one place, `control-access.service.ts`, used by the HTTP routes and the socket. Any database error means "no access" (fail closed). Ending the friendship, turning the switch off or withdrawing a license removes access at once; the friend is told through `permission:changed` (#183).

| Endpoint | Use |
|---|---|
| `GET /api/music-control/devices`, `PATCH /devices/:deviceId` | list and rename my devices |
| `POST/DELETE /api/music-control/devices/:deviceId/licenses/:userId` | grant or withdraw a license on one of my devices |
| `POST/DELETE /api/music-control/permissions/:userId`, `GET /permissions` | the "all my devices" switch |
| `GET /api/music-control/users/:userId/devices` | a friend's devices I may control |
| `GET /api/music-control/controllable-devices` | every device I may play on: mine, then my friends' |

## Listening and remote control

- A friend with access to at least one device subscribes to the owner's listening status (`listening:subscribe`), and sees what each device plays.
- `control:action` sends `play` or `pause` to one device; the server checks access on that device, then that it is online, and forwards `control:command`. Identity always comes from the socket, never from the payload.
- Each device reports what it plays with `listening:update` (throttled to one broadcast per second per device, keeping the latest state, #151).

A delegate can also manage the owner's play queue and move playback between devices: [queue-and-connect.md](queue-and-connect.md).

## Tests

`control-access.service.test.ts` (the rule), `device-license.int.test.ts` (grants and refusals), `backend/src/realtime/music-control-access.int.test.ts` (per-device access on the socket: a friend licensed on device A controls A and is refused on B until B is licensed; eviction on revocation; forged payloads). Security analysis: [threat-model.md](../security/threat-model.md#m11-music-control-of-an-unauthorized-device).
