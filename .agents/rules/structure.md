# Structure rules

Read before creating a file or a folder. Every rule here is checked by `npm run check`; the error message links to its section. Rules are append-only: see [guardrails.md](guardrails.md#append-only-rules).

## placement

Where a file goes is set by the target layout in `doc/architecture/code-layout.md` and summarized in `AGENTS.md`:

- Backend: `src/features/<name>/` holds `<name>.routes.ts`, `<name>.controller.ts`, `<name>.validators.ts`, `<name>.types.ts`, `<name>.openapi.ts`, logic in `services/`, authorization in `permissions/`, helpers in `utils/`. Cross-cutting code (config, middleware, security, types) goes in `src/shared/`; the Socket.io server in `src/realtime/` (`socket-server.ts`, `handlers/`, `emitters/`); the composition root (routes registry, OpenAPI document) in `src/app/`.
- Mobile: three layers, `src/app/`, `src/features/` and `src/shared/` ([mobile-layers](architecture.md#mobile-layers)). `src/app/` composes the features into the navigation and imports only features; `src/app/App.tsx`, registered by `index.ts`, mounts `AppProvidersContainer` from `features/shell` and `RootNavigator`. A feature is a domain of the subject (`user` for IV.1, `playlists` with its `editor` for IV.2.3, `playback` with its `control-delegation` for IV.2.2, `events`, `subscription`, `search`, `legal`, `shell`). It holds kind folders for its own files, its sub-features in `features/` and the shared features they share in `shared/`, and the same shape repeats one level down. A component's role is read from its name ([components.md](components.md#roles-by-name)), and tests sit next to their file:

  ```
  features/<feature>/
  ├── components/ hooks/ lib/ …   (the feature's own files; orchestrators/ and presenters/ inside components/ once there are two of a role)
  ├── features/<sub-feature>/      (a screen or a part of the domain, same shape)
  └── shared/<shared-feature>/              (what several sub-features use; a shared feature imports no other shared feature and its files import each other)
  ```

  A sub-feature never imports a sibling, nor the root files of its feature: what two sub-features share goes in the feature's `shared/`, and what they pass each other goes through `app/` as props (render-prop containers such as `PlanContainer`, `FriendListeningContainer`, `PlaylistCardMenuContainer`, `PlaylistPlaybackContainer`, and components such as `TrackActionsSheet`).

  A kind folder (`hooks/`, `stores/`, `lib/`…) exists once it holds two files: a single hook, store or lib file sits at the root of its feature or shared feature ([check-tree](#check-tree)).

  `src/shared/` holds what several features use, one folder per shared feature named after its concept, with its own kind folders (`components/`, `hooks/`, `lib/`) once it holds two files of a kind. A shared feature is a leaf: it imports no other shared feature (dependency-cruiser `no-cross-shared`, [mobile-layers](architecture.md#mobile-layers); type-only imports do not count), and its files import each other (check-tree). A shared feature file that a single feature uses lives in that feature. The shared features:
  - `theme/`: the design system: tokens, fonts, `pixelFrame`, the primitives ([ui-primitives](#ui-primitives)) `Pressable`, `Button`, `Text`, `TextInput`, `Input`, `SearchBar`, `Card`, `ThemedSwitch`, the skeletons, `PixelIcon`, `Avatar`, `Artwork`, `LoadingSpinner`, dialogs, menus, breakpoints, the genres;
  - `backend/`: the connection to the server: `apiRequest.ts` and its `apiClient.ts`, `backendUrl.ts`, the session (`authSession.ts`), the device identity, `queryClient.ts`, `socketStore.ts`, `socketCache.ts`, and `onBackendError`, through which `features/shell/lib/startApp.ts` logs what goes wrong in there; `query-keys/`: the key factory ([state.md](state.md));
  - `playback/`, `tracks/`, `users/`: shared domain types and pure functions, such as the props one feature receives from another (`PlaybackActions`, `TrackActionsSheetComponent`);
  - `logging/`, `formatting/`, `debounce/`, `platform/`, `alerts/`, `content-column/`, `image-colors/`, `image-picker/`, `square-image/`, `external-links/`, `project-links/`, `share-links/`, `keyboard-shortcuts/`, `screen-title/`…

  Test helpers live in `mobile/test-utils/`, outside `src/`, imported through `@test-utils/`; production code never imports them (dependency-cruiser `no-prod-to-tests`).
- Tests sit next to the file they test.

## no-index-files

No file named `index.ts` (or `index.tsx`) under `src/` (backend: ESLint `no-restricted-syntax`; mobile: oxlint `check-file/no-index` from the brutalway preset). An index file is either a barrel that re-exports, which hides where code lives and creates cycles, or a module with a name that says nothing. Name the file after what it holds and import that file directly.

The app entry points outside `src/` (`mobile/index.ts`, required by Expo) are not concerned.

## backend-feature

The shape of a backend feature once migrated (epic #362; `src/features/auth/` is the reference, #368–#373 follow it). Review enforces it; `check` catches part of it (dependency-cruiser layers, jscpd, knip).

- **Services are modules of exported functions** in `services/`, never a class instantiated once or a class of static methods. Module state (a client, a limiter) is a module constant. No `<name>.service.ts` at the feature root.
- **Call sites use a namespace import**: `import * as sessionService from '@/features/auth/services/session.service.js'`, then `sessionService.verifyToken(token)`. Tests mock the module: `vi.mock('…/session.service.js', () => ({ verifyToken }))`. A function another test must replace lives in its own module, since `vi.spyOn` cannot reach a call inside the same module.
- **Controllers are exported handler functions without `try/catch`**: Express 5 forwards a rejected promise to `errorHandler`, and a Zod `parse` throws a `ZodError` that becomes a 400 `VALIDATION_ERROR`. A handler catches only to act on a failure (record a failed login, then rethrow). Answer with `sendSuccess(res, data, status?)` from `@/shared/utils/send-success.js`. A large controller splits by subject into `<name>-<subject>.controller.ts` at the feature root, matching the `<name>-<subject>.openapi.ts` files.
- **Routes pass the handlers directly**, `router.post('/login', loginRateLimiter, checkAccountLockout, session.login)`, with the controller imported as a namespace. No arrow wrapper and no `@route` JSDoc: the OpenAPI files document the endpoints.
- **Files stay at 150 lines or less** (tests excepted): split a service by use case rather than grow it.
- **Request input types come from the validators** (`export type LoginInput = z.infer<typeof loginSchema>` in `<name>.validators.ts`); `<name>.types.ts` keeps response and domain types, inferred from the response schemas when one exists. No DTO interface that repeats a schema.

## ui-primitives

Mobile: every touchable element is a `Pressable` or a `Button` from `src/shared/theme/components/` (ESLint `guardrails/ui-primitives`). `TouchableOpacity`, and `Pressable` from `react-native`, are imported or used (`RN.Pressable`) only in the primitives that `eslint.config.mjs` lists (the files of the former `components/ui/` folder), tests included.

- `Pressable` fixes the press opacity (`PRESSED_OPACITY`), sets the `button` role unless told otherwise, fires an optional haptic (`haptic="tap" | "selection" | "success"`, through `@/shared/theme/lib/haptics`) and requires an `accessibilityLabel` in its type, so no control is silent for a screen reader.
- `Button` is built on it; its label (`title` or the text children) is its accessibility label unless one is given.
- Gestures (swipe, drag and drop, the mini-player) stay on `react-native-gesture-handler`.
- Text goes through the `Text` and `TextInput` primitives ([text-primitives](#text-primitives)).

## theme-tokens

Mobile: no colour literal outside the theme modules listed in `eslint.config.mjs` (`src/shared/theme/lib/`, `useThemedStyles.ts`, `focusedFieldStyle.ts`, `image-colors/lib/adaptivePalette.ts`) (ESLint `guardrails/theme-tokens`): no hex string (`'#FFF'`), no `rgb(`/`rgba(`/`hsl(` string, and no named colour (`'white'`) as a colour prop or style key; a template literal that starts as a colour (`` `rgba(${r}, …)` ``) counts too. Read the colour from the theme: `const { theme } = useTheme()`, then `theme.colors.primary`. A colour every theme lacks is added to `ThemeColors` (`src/shared/theme/types/themeTypes.ts`) and to the four themes. `'transparent'` is allowed. Tests are covered too.


## text-primitives

Mobile: `Text` and `TextInput` come from `src/shared/theme/components/` (ESLint `guardrails/text-primitives`), never from `react-native`; only `theme/components/Text.tsx` and `theme/components/TextInput.tsx` import the native ones. The primitives set the regular Pixelify Sans family, so a text without a style is in the brand font too; a nested `Text` keeps its parent's family. Type imports (`useRef<TextInput>`, `import type { TextInput } from 'react-native'`) stay allowed.

## font-families

Mobile: no `fontWeight` and no font name (`fontFamily: 'Arial'`) outside the theme modules listed in [theme-tokens](#theme-tokens) (ESLint `guardrails/font-families`). Each weight of Pixelify Sans is its own family: Android picks a weight by family, not by `fontWeight`, and the browser fakes a bolder weight when a `fontWeight` is set on top of the family. Set `fontFamily: theme.typography.families.semibold` (or `FONT_FAMILIES.semibold` from `@/shared/theme/configs/fontsConfig` where no theme is at hand). A new weight is added to `FONT_FAMILIES` and `FONT_ASSETS` in `src/shared/theme/configs/fontsConfig.ts`, which `features/shell/hooks/useAppFontsReady.ts` loads before the first render. Titles, button labels and avatar initials use the `display` family (Jersey 10, a single weight): spread `displayText(theme, size, role)` from `src/shared/theme/lib/pixelFrame.ts`, which scales the size by `typography.displayScale`, since Jersey 10 looks smaller than Pixelify Sans at the same size.

## check-tree

Mobile: the folders of `src/` follow the layout of [brutalway](https://brutalway.elnop.dev/) (epic #616), checked by `@brutalway/check-tree` (`npm run check:tree`). It reports, one line per folder:

- an empty folder (tests do not count: a folder holding only a test is empty);
- a kind folder (`components`, `orchestrators`, `presenters`, `hooks`, `stores`, `services`, `lib`…) holding a single child: move the child up one level and delete the folder;
- two files of one kind outside their kind folder (`holds 2 lib files`): move them into it;
- a folder the layout does not name: `src/` holds `app/`, `features/` and `shared/`, `shared/` holds one folder per shared feature named after its concept, and a feature or a shared feature holds kind folders, `features/` and `shared/`;
- a file of a shared feature that a single feature uses (move it into that feature), and a shared feature whose files form groups that never import each other (split it);
- a file of the `shared/` of a feature that only the root of that feature uses, none of its sub-features: move it into the kind folders of the feature.

A test never counts as a consumer for check-tree, but dependency-cruiser checks its imports like any other file: a test that exercises a sub-feature together with the root of its feature sits at the root, next to the root file it drives.

check-tree has no exception list: every violation fails `npm run check` ([exception-lists](guardrails.md#exception-lists)).

Since #622 the role of a component comes from its name, so `components/orchestrators/` and `components/presenters/` follow the grouping rule like any kind folder: a single orchestrator or presenter sits in `components/`, and a role folder exists once it holds two of them.
