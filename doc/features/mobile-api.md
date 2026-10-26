# API and mobile client

Subjects IV.4 (API) and IV.5 (mobile application): a documented REST/JSON API, and an app that is only a remote control of it, whose backend address can be changed for testing.

## The API contract

- REST with JSON bodies and standard HTTP statuses (choice justified in [decisions.md](../decisions.md#16-protocol-rest-and-json)).
- **One success envelope** (`sendSuccess`) and **one error format** for every error response, through the backend's single error middleware (#365):

  ```json
  { "success": false, "error": { "message": "…", "code": "PLAYLIST_NOT_FOUND", "details": {}, "why": "…", "fix": "…" }, "meta": {} }
  ```

  The app reads it into `ApiError`, keeping the HTTP status, and turns the code into a French message (`shared/utils/apiErrorMessage.ts`).
- **Every input is validated by Zod** before the controller uses it; a failure is a `400 VALIDATION_ERROR`.

## Documentation generated from the code

Swagger UI at `/api-docs` documents every endpoint with its method, parameters, body, responses and errors. It is generated from the same Zod schemas that validate the requests (`@asteasolutions/zod-to-openapi`, #366), so the documentation cannot drift from the code; the subject explicitly accepts a generated reference. `backend/src/app/openapi-coverage.test.ts` fails when a mounted route is missing from the document, or when a documented route is not mounted. How to add an endpoint: [backend/README.md](../../backend/README.md#api-documentation).

## The mobile client

- **Every HTTP call goes through `shared/services/api.ts`** (#174). It adds the access token, refreshes it when it is about to expire or after a 401 (except for a wrong-password login, whose 401 is shown as is, #235), and sends the `X-Platform`, `X-Device-Model` and `X-App-Version` headers that the backend logs with every action (subject IV.6). No module calls `fetch` around it (semgrep rule).
- **Server data is cached by TanStack Query**, and socket events update that cache, so screens show the server's state without polling.
- **Changing the backend address in the app**: a field in Settings and on the Welcome screen (reachable before login) edits the address (`shared/services/backendUrl.ts`, `BackendUrlField`). It is persisted, validated, read by every module at call time, and the socket reconnects to the new address: no rebuild is needed. The default is the build-time `EXPO_PUBLIC_API_URL`.
- **Socket.io** carries the same token at the handshake, plus the device identity; the event list is in [backend/README.md](../../backend/README.md#real-time-socketio).
- **Build information**: the Profile screen and the Welcome screen (before login, #492) show `Zumik <version> (build <N> · <sha>)` for a release build, `(dev)` for a local debug build (#361).
