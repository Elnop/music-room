---
title: 'Mobile : migrer la feature queue et Connect (#381)'
type: 'refactor'
ticket: 'https://github.com/Elnop/music-room/issues/381'
created: '2026-10-22'
status: 'draft'
baseline_revision: ''
route: 'full'
route_source: 'auto'
risk: 'high'
review: ''
review_source: ''
lenses_ran: []
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/docs/superpowers/specs/2026-10-21-clean-codebase-refactor-design.md', '{project-root}/.agents/rules/architecture.md', '{project-root}/.agents/rules/structure.md', '{project-root}/.agents/rules/state.md', '{project-root}/.agents/rules/logging.md', '{project-root}/.agents/rules/guardrails.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** GitHub #381, epic #362. The `queue et Connect` code of the mobile app is spread across the legacy technical folders (`screens/`, `components/`, `store/`, `hooks/`, `services/`, `api/`, `contexts/`, `utils/`). Its large files go far over 150 lines, it fetches server data by hand in Zustand stores, and it uses raw `TouchableOpacity` and hard-coded colours.

**Approach:**
- **Location:** move the feature into `src/features/queue/` per `.agents/rules/structure.md` and `state.md`.
- **Components:** each non-trivial component splits into an orchestrator (wires hooks and stores, picks a presenter), presenters (props in, JSX out: no state, no effects, no stores, no requests) and hooks (logic and state, no JSX, an explicit return interface). Screens in `navigation/` render only an orchestrator.
- **Server data:** read it through TanStack Query hooks, using the key factory and cache profiles in `shared/query/`. Writes go through mutations, and socket events update the cache through `shared/query/socketCache`. Zustand stores keep only client state.
- **Shared primitives:** use `shared/components/ui` and the theme tokens.
- **Size and tests:** keep every file at 150 lines or fewer, and move the tests with the code.

## Boundaries & Constraints

**Always:**
- The user sees the same screens, texts, flows, loading, empty and error states, and realtime updates as on `develop`. The only allowed difference is the harmonised press feedback of the `Pressable` primitive.
- No import from another feature (`.agents/rules/architecture.md`).
  - When this feature needs something another feature owns, use an existing `shared/` contract, or compose at the `navigation/` level.
  - If neither exists, add the smallest neutral contract in `shared/`: a type, a store interface, or a callback prop.
  - Legacy, not-yet-migrated folders may still import this feature for now.
- Remove this feature's entries from every exception list, and add none: `guardrails/ui-primitives`, `theme-tokens`, `zustand-selector`, jscpd, depcruise and semgrep.
- `npm run check` passes in `mobile/`. Coverage of the moved code (`jest --coverage` on the old paths before, the new folder after) does not drop.
- API calls keep going through `shared/services/api.ts`, since the backend logs every app action (subject IV.6).
- A change to backend response types is mirrored in the feature's `types.ts`; the backend itself is untouched.

**Never:**
- Change a backend endpoint or a socket event.
- Restyle anything, or change copy.
- Migrate another feature's code beyond the contract it needs.

</frozen-after-approval>

## Code Map

- Data: `store/queueStore.ts` (371 lines), `queueSelectors.ts` and `moveTarget.ts`, with `services/queueApi.ts`. They become a TanStack query, the queue state. Mutations go through optimistic updates or invalidation, and `queue:updated` is applied to the cache with the version check from #285: ignore any state older than the cached one.
- Connect: `store/connectStore.ts`, `transferPlayback.ts`, `hooks/useRemoteTarget.ts` and `hooks/useQueueSync.ts`.
- Components: `components/player/QueueModal.tsx`, `QueueItemRow.tsx` (207) and `DevicePickerSheet.tsx` (361). `shared/components/lists/QueueSwipe` is already shared.
- Keep the behaviour of epic #272 and spec `docs/superpowers/specs/2026-10-14-queue-delegation-connect-design.md`: delegation, transfer, remote control and the mini-player always visible.
- The player has been in `features/player` since #380. Talk to it through the `shared/` contract #380 introduced, or add one. Never import the player feature directly.
- Pattern and rules: `.agents/rules/structure.md` (mobile placement, `ui/` primitives), `state.md` (TanStack vs Zustand, keys, selectors), `architecture.md` (layers, no cross-feature imports). Shared building blocks: `src/shared/query/` (`queryClient`, `keys`, `socketCache`), `src/shared/components/ui/` (`Pressable`, `Button`, `Input`, `Card`…), `src/shared/theme/`.
- Exception entries to remove: `grep -n "<moved path>" mobile/eslint-suppressions.json mobile/.dependency-cruiser-known-violations.json mobile/.jscpd.json tools/semgrep/rules.yml`. Prune them with `npx eslint --prune-suppressions` and by regenerating the depcruise baseline.

## Tasks & Acceptance

**Execution:**
- [ ] Record coverage of the files being moved -- baseline.
- [ ] Create `src/features/queue/`: server data through TanStack hooks, client stores, orchestrators, presenters and hooks; screens point to the orchestrators -- feature layout.
- [ ] Delete the emptied legacy files; update importers -- no duplicate path.
- [ ] Tests follow the code; prune the exceptions; update the docs that name the moved paths (`AGENTS.md`, `mobile/README.md`, `doc/`).

**Acceptance Criteria:**
- Given `src/features/queue/`, then every file is 150 lines or fewer, presenters hold no state, effects, stores or requests, and no file imports another feature.
- Given the feature's flows in the jest suite, then they pass with the same visible behaviour (texts, states, navigation) as on `develop`.
- Given `npm run check` in `mobile/`, then it passes with fewer exception entries than on `develop`, and none for this feature's files.
- Given coverage of the moved code, then it is at least the baseline.

## Implementation Notes

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd mobile && npm run check` -- expected: all OK.
- `find mobile/src/features/queue -name '*.ts*' ! -name '*.test.*' | xargs wc -l | awk '$1>150'` -- expected: only the total line.

**Manual checks:**
- On the next `main` build, the feature's flows (listed in the PR) behave as before.

## Design Notes

- Session access: read the current user and token through `shared/services/authSession.ts` (`useSession(selector)`, `getSession()`), never `features/auth` (set by #378).
- #378 showed the shared query client's defaults (5-min `STALE.long`, 2 retries) can change visible loading/error behaviour. For each query, pick options that keep develop's behaviour (e.g. refetch on screen focus/mount where develop fetched on mount, `retry: false` where develop showed the error at once) and test with the app's real `createQueryClient()`, not a `retry:false` test client.
- An error toast that develop gated on focus/mount must stay gated (see `features/auth/form/hooks/useFocusedErrorToast.ts`; move it to `shared/` if a second feature needs it).
- Storage: AsyncStorage only in files named `<thing>Storage.ts` (see `.agents/rules/guardrails.md`).
