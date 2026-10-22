# State rules

Read before fetching server data on the mobile, or before adding or reading a Zustand store. Every rule here is checked by `npm run check` where a tool can check it; the error message links to its section. Rules are append-only: see [guardrails.md](guardrails.md#append-only-rules).

## server-vs-client-state

Two kinds of state, two tools (epic #362):

- **Server data** (playlists, queue, friends, profiles, devices, search results) is read with **TanStack Query**: a query hook calls the feature's service, which goes through the API client (`@/shared/services/api`). Mutations use `useMutation`, then update or invalidate the affected keys. Errors are the typed `ApiError`; show them with `apiErrorMessage(error, fallback)`.
- **Client state** (session, player, preferences, UI) lives in **Zustand**: cross-cutting stores in `src/shared/stores/`, a feature's own stores in its `stores/` folder.

A Zustand store that copies server data and refreshes it by hand moves to TanStack Query when its feature migrates (#378–#385); no new one is written.

The `QueryClient` comes from `createQueryClient()` (`src/shared/query/queryClient.ts`), provided once by `AppProviders` (`src/providers/AppProviders.tsx`). A test renders with its own client (`<AppProviders queryClient={client}>` or a `QueryClientProvider`) and calls `client.clear()` at the end, so cache timers stop.

## query-keys

Every query key is built by the factory `queryKeys` (`src/shared/query/keys.ts`), never written inline: `useQuery({ queryKey: queryKeys.playlists.detail(id), ... })`. Each domain has an `all` root that prefixes all its keys, so `invalidateQueries({ queryKey: queryKeys.playlists.all })` refreshes every playlist query. A new kind of query adds its builder to its domain there (or a new domain).

## cache-profiles

How long data stays fresh is one of the named profiles of `STALE` (`src/shared/query/queryClient.ts`): `none` (refetch on every mount), `short` (the default), `long` (data that rarely changes). A query picks one (`staleTime: STALE.long`) instead of a number of its own. The client retries a failed query on a network error or a 5xx, at most twice, never on a 4xx, and never retries a mutation.

## socket-cache

A Socket.io event that changes server data updates the query cache; the screen never refetches by hand on an event. Describe what each event does with `socketCacheRule` (`src/shared/query/socketCache.ts`): the key of the query it touches (from `queryKeys`, or `null` to ignore the payload), and optionally an `update` that patches the cached data (`setQueryData`). Without `update`, when nothing is cached, or when `update` returns `undefined` (a payload it cannot apply, such as an older version), the query is invalidated and refetched. The version check of the queue (#285, stale states rejected) is written in that `update`. Mount the rules with `useSocketCache(rules)`, passing a stable array (module constant or `useMemo`). Event names come from `backend/src/realtime/`; never assume them.

## zustand-selectors

A Zustand store hook is always called with a selector: `useAuthStore(state => state.user)`, never `useAuthStore()` (ESLint `guardrails/zustand-selector`). Without a selector the component subscribes to the whole store and re-renders on every change of any field. Select one value per call, or several with `useShallow` from `zustand/shallow`. Outside React, read the store with `useXStore.getState()`.
