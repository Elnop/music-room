# Structure rules

Read before creating a file or a folder. Every rule here is checked by `npm run check`; the error message links to its section. Rules are append-only: see [guardrails.md](guardrails.md#append-only-rules).

## placement

Where a file goes is set by the target layout in `doc/architecture/code-layout.md` and summarized in `AGENTS.md`:

- Backend: `src/features/<name>/` holds `<name>.routes.ts`, `<name>.controller.ts`, `<name>.validators.ts`, `<name>.types.ts`, `<name>.openapi.ts`, logic in `services/`, authorization in `permissions/`, helpers in `utils/`. Cross-cutting code (config, middleware, security, types) goes in `src/shared/`; the Socket.io server in `src/realtime/` (`socket-server.ts`, `handlers/`, `emitters/`); the composition root (routes registry, OpenAPI document) in `src/app/`.
- Mobile: `src/features/<feature>/` (components, hooks, services, stores of one feature), `src/shared/`, `src/navigation/`, `src/providers/` (`AppProviders.tsx`, the providers `App.tsx` wraps the app in). The legacy folders (`components/<feature>/`, `screens/`, `store/`, `hooks/`, `contexts/`, `services/`, `api/`, `utils/`) move into `features/` story by story (#378–#385); add nothing new to them. Every feature has the same layout, and a component's role is read from its name ([components.md](components.md#roles-by-name)); a subject folder always exists, even for a single-subject feature, `*Styles.ts` files sit with their presenters, and tests sit next to their file:

  ```
  features/<feature>/
  ├── hooks/ services/ stores/ utils/ constants.ts types.ts validators.ts …   (shared by subjects)
  ├── context/                                                                 (React providers)
  └── <subject>/
      ├── components/        (orchestrators/ and presenters/ inside, once there are two of a role)
      ├── hooks/
      └── utils/                                                             (optional: the subject's own helpers, no JSX)
  ```

  A category folder (`hooks/`, `stores/`, `services/`…) exists once it holds two files: a single hook, store or service sits at the root of its subject or feature ([check-tree](#check-tree)).

  `src/shared/` holds what several features use, one folder per slice named after its concept, with its own kind folders (`components/`, `hooks/`, `lib/`) once it holds two files of a kind. A slice is a leaf: it imports no other slice (dependency-cruiser `no-cross-shared`, [mobile-layers](architecture.md#mobile-layers); type-only imports do not count), and its files import each other (check-tree). A slice file that a single feature uses lives in that feature. The slices:
  - `theme/`: the design system: tokens, fonts, `pixelFrame`, the primitives ([ui-primitives](#ui-primitives)) `Pressable`, `Button`, `Text`, `TextInput`, `Input`, `SearchBar`, `Card`, `ThemedSwitch`, the skeletons, `PixelIcon`, `Avatar`, `Artwork`, `LoadingSpinner`, dialogs, menus, breakpoints and `ContentFrame`, the genres;
  - `backend/`: the connection to the server: `api.ts`, `backendUrl.ts`, the session (`authSession.ts`), the device identity, `queryClient.ts`, `socketStore.ts`, `socketCache.ts`, and `onBackendError`, through which `App.tsx` logs what goes wrong in there; `query-keys/`: the key factory ([state.md](state.md));
  - `playback/`, `tracks/`, `users/`: shared domain types and pure functions, such as the props one feature receives from another (`PlaybackActions`, `TrackActionsSheetComponent`);
  - `logging/`, `formatting/`, `debounce/`, `platform/`, `alerts/`, `image-colors/`, `image-picker/`, `square-image/`, `external-links/`, `project-links/`, `share-links/`, `keyboard-shortcuts/`, `screen-title/`…

  Test helpers live in `mobile/test-utils/`, outside `src/`, imported through `@test-utils/`; production code never imports them (dependency-cruiser `no-prod-to-tests`).
- Tests sit next to the file they test.

## no-index-files

No file named `index.ts` (or `index.tsx`) under `src/` (ESLint `no-restricted-syntax`). An index file is either a barrel that re-exports, which hides where code lives and creates cycles, or a module with a name that says nothing. Name the file after what it holds and import that file directly.

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

Mobile: no colour literal outside the theme modules listed in `eslint.config.mjs` (`src/shared/theme/lib/`, `ThemeContext.tsx`, `useThemedStyles.ts`, `fieldFocus.ts`, `image-colors/adaptivePalette.ts`) (ESLint `guardrails/theme-tokens`): no hex string (`'#FFF'`), no `rgb(`/`rgba(`/`hsl(` string, and no named colour (`'white'`) as a colour prop or style key; a template literal that starts as a colour (`` `rgba(${r}, …)` ``) counts too. Read the colour from the theme: `const { theme } = useTheme()`, then `theme.colors.primary`. A colour every theme lacks is added to `ThemeColors` (`src/shared/theme/lib/types.ts`) and to the four themes. `'transparent'` is allowed. Tests are covered too.


## text-primitives

Mobile: `Text` and `TextInput` come from `src/shared/theme/components/` (ESLint `guardrails/text-primitives`), never from `react-native`; only `theme/components/Text.tsx` and `theme/components/TextInput.tsx` import the native ones. The primitives set the regular Pixelify Sans family, so a text without a style is in the brand font too; a nested `Text` keeps its parent's family. Type imports (`useRef<TextInput>`, `import type { TextInput } from 'react-native'`) stay allowed.

## font-families

Mobile: no `fontWeight` and no font name (`fontFamily: 'Arial'`) outside the theme modules listed in [theme-tokens](#theme-tokens) (ESLint `guardrails/font-families`). Each weight of Pixelify Sans is its own family: Android picks a weight by family, not by `fontWeight`, and the browser fakes a bolder weight when a `fontWeight` is set on top of the family. Set `fontFamily: theme.typography.families.semibold` (or `FONT_FAMILIES.semibold` from `@/shared/theme/lib/fonts` where no theme is at hand). A new weight is added to `FONT_FAMILIES` and `FONT_ASSETS` in `src/shared/theme/lib/fonts.ts`, which `App.tsx` loads before the first render. Titles, button labels and avatar initials use the `display` family (Jersey 10, a single weight): spread `displayText(theme, size, role)` from `src/shared/theme/lib/pixelFrame.ts`, which scales the size by `typography.displayScale`, since Jersey 10 looks smaller than Pixelify Sans at the same size.

## check-tree

Mobile: the folders of `src/` follow the layout of [brutalway](https://brutalway.elnop.dev/) (epic #616), checked by `@brutalway/check-tree` (`npm run check:tree`). It reports, one line per folder:

- an empty folder (tests do not count: a folder holding only a test is empty);
- a category folder (`components`, `orchestrators`, `presenters`, `hooks`, `stores`, `services`, `lib`…) holding a single child: move the child up one level and delete the folder;
- two files of one kind outside their category folder (`holds 2 lib files`): move them into it;
- a folder the layout does not name: `src/` holds `app/`, `features/` and `shared/`, `shared/` holds one folder per slice named after its concept, and a feature or a slice holds kind folders, `features/` and `shared/`;
- a file of a `shared/` slice that a single feature uses (move it into that feature), and a slice whose files form groups that never import each other (split it).

The violations that existed when the rule arrived are listed in `mobile/.check-tree-known-violations.json`, which check-tree skips. It fails on a violation that is not listed and on a listed one that no longer happens. After fixing folders, rewrite the list with `npx check-tree src --write-known-violations` (from `mobile/`) and check the diff: it may only lose lines, and `check:exceptions` fails if it gains one. When you move files, the entries of the folders they leave may come back under the folder they reach: that is accepted as long as the list does not grow ([exception-lists](guardrails.md#exception-lists)).

Since #622 the role of a component comes from its name, so `components/orchestrators/` and `components/presenters/` follow the grouping rule like any category folder: a single orchestrator or presenter sits in `components/`, and a role folder exists once it holds two of them.
