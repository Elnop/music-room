# #296 Mini-player toujours visible : implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le mini-player est toujours affiché (« Rien en lecture » sans morceau) et ouvre une modale de lecture qui fonctionne aussi sans morceau ; la place qu'il occupe est toujours réservée.

**Architecture:** Trois changements côté mobile :
- `usePlayerHeight()` renvoie toujours `MINI_PLAYER_HEIGHT`, ce qui réserve la place dans les écrans et sous le bouton Play flottant de #277 ;
- `MiniPlayer` a un état vide ;
- `PlayerModal` a un état vide : pochette neutre, « Rien en lecture », contrôles désactivés, bouton Queue conservé.

**Tech Stack:** Expo React Native, Zustand, jest-expo + @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-10-14-queue-delegation-connect-design.md` (Mobile › Mini-player toujours visible). Ticket : #296.

## Global Constraints

- Worktree `../music-room-296`, branche `296-mini-player-always-visible` depuis `origin/develop`, PR vers `develop`. Jamais de commit sur `main`.
- Conventional Commits ; chaque message finit par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Textes visibles en français : « Rien en lecture » (titre), « Choisis un son pour commencer » (sous-titre du mini-player et de la modale vides).
- Pas de barrel, pas de `any`. Pas de nouvelle dépendance.
- Le comportement avec un morceau chargé ne change pas.
- Hors scope : mode télécommande et ligne « Sur … » (#297), choix d'appareil (#298).
- Une PR #295 touche aussi `PlayerModal.tsx` (`handleSeek`) en parallèle : ne pas réorganiser ce fichier au-delà du nécessaire, pour garder les conflits triviaux.

## Review Focus

1. Mini-player vide : appuyer sur play ou suivant ne lance rien et ne plante pas (pin Task 1).
2. Modale vide : le slider, précédent, play et suivant sont désactivés ; le bouton Queue ouvre la queue (pin Task 2).
3. Passage vide → morceau chargé → arrêt (`stop`) : le mini-player revient à l'état vide sans changer de hauteur (pin Task 1).
4. Les listes et le bouton Play flottant gardent la même marge basse avec ou sans morceau (pin Task 1, `usePlayerHeight`).
5. `useImageColors` reçoit `null` sans morceau et la modale garde les couleurs du thème (pin Task 2).

---

### Task 1: Mini-player toujours affiché et place réservée

**Files:**
- Modify: `mobile/src/contexts/PlayerContext.tsx:325-332` (`usePlayerHeight`)
- Modify: `mobile/src/components/player/MiniPlayer.tsx`
- Test: Create `mobile/src/components/player/MiniPlayer.test.tsx`; Create `mobile/src/contexts/usePlayerHeight.test.tsx` (ou un `describe` dans un test existant de `PlayerContext` s'il en existe un)

**Interfaces:**
- Produces: `usePlayerHeight(): number` renvoie toujours `MINI_PLAYER_HEIGHT` ; `MiniPlayer` rend un état vide quand `currentTrack` est null.

- [ ] **Step 1: Tests qui échouent**

`MiniPlayer.test.tsx` — reprendre les mocks de `QueueModal.test.tsx` (ThemeContext, safe-area, async-storage, deviceService, queueApi) et mocker `@/contexts/PlayerContext` (`usePlayer: () => ({ player: { playing: false } })`) et `@/hooks/usePlayerProgress` (`() => ({ progress: 0, currentTime: 0, duration: 0 })`) :

```tsx
describe('MiniPlayer', () => {
	beforeEach(() => {
		usePlayerStore.setState({ currentTrack: null, playbackState: 'idle', isModalOpen: false });
	});

	it('shows "Rien en lecture" without a track and opens the modal on tap', () => {
		render(<MiniPlayer />);
		expect(screen.getByText('Rien en lecture')).toBeTruthy();
		expect(screen.getByText('Choisis un son pour commencer')).toBeTruthy();
		fireEvent.press(screen.getByText('Rien en lecture'));
		expect(usePlayerStore.getState().isModalOpen).toBe(true);
	});

	it('disables play and next without a track', () => {
		const resume = jest.spyOn(usePlayerStore.getState(), 'resume');
		render(<MiniPlayer />);
		fireEvent.press(screen.getByLabelText('Play'));
		fireEvent.press(screen.getByLabelText('Next track'));
		expect(resume).not.toHaveBeenCalled();
		expect(queueApi.next).not.toHaveBeenCalled();
	});

	it('shows the track, then the empty state again after stop', () => {
		usePlayerStore.setState({ currentTrack: track, playbackState: 'paused' });
		render(<MiniPlayer />);
		expect(screen.getByText(track.title)).toBeTruthy();
		act(() => usePlayerStore.getState().stop());
		expect(screen.getByText('Rien en lecture')).toBeTruthy();
	});
});
```

(`track` : un `SoundCloudTrack` minimal comme dans `queueStore.test.ts:66-76`.) Le bouton play porte `accessibilityLabel={isPlaying ? 'Pause' : 'Play'}` (à ajouter).

Test de `usePlayerHeight` : avec et sans `currentTrack` dans `playerStore`, `renderHook(() => usePlayerHeight())` vaut `MINI_PLAYER_HEIGHT`.

Run: `cd mobile && npx jest src/components/player/MiniPlayer.test.tsx src/contexts` — Expected: FAIL.

- [ ] **Step 2: Implémenter**

`usePlayerHeight` :

```ts
/**
 * Height of the MiniPlayer, for bottom padding: always MINI_PLAYER_HEIGHT,
 * since the mini-player is always shown (#296).
 */
export function usePlayerHeight(): number {
	return MINI_PLAYER_HEIGHT;
}
```

`MiniPlayer` : retirer le `return null`. Sans `currentTrack` :
- à la place de la pochette, une vue de même taille (`styles.artwork`) sur fond `theme.colors.surface`, avec une icône `musical-notes` de 20 px en `theme.colors.textSecondary` ;
- titre « Rien en lecture », sous-titre « Choisis un son pour commencer » ;
- bouton play affiché mais `disabled`, avec l'icône `play` à demi-opacité (`styles.disabledIcon`) ;
- bouton suivant `disabled` ;
- barre de progression à 0 %.

Le tap sur le conteneur ouvre la modale (`toggleModal`), comme aujourd'hui. Sortir le contenu de gauche (pochette, titre, artiste) dans une petite fonction du même fichier, `NowPlayingInfo`, qui reçoit `currentTrack | null`, pour éviter les ternaires répétés.

Run: les tests du Step 1, puis `npm test && npm run type-check && npm run lint` — Expected: PASS. `PlayPlaylistButton.test.tsx` mocke `usePlayerHeight: () => 0` : le laisser tel quel.

- [ ] **Step 3: Commit** — `feat(mobile): always show the mini-player, with an empty state`

---

### Task 2: Modale de lecture sans morceau

**Files:**
- Modify: `mobile/src/components/player/PlayerModal.tsx`
- Test: Create `mobile/src/components/player/PlayerModal.test.tsx`

**Interfaces:**
- Consumes: Task 1 (le mini-player vide ouvre la modale).
- Produces: `PlayerModal` rend un état vide quand `currentTrack` est null et `isModalOpen` est vrai.

- [ ] **Step 1: Tests qui échouent**

`PlayerModal.test.tsx` — mocks de `QueueModal.test.tsx`, plus `@/hooks/useImageColors` (`useImageColors: jest.fn(() => ({ dominantColor: null }))`, et `hexToRgba`, `getAdaptiveColors`, `isLightColor` en fonctions identité simples), `expo-linear-gradient` (`LinearGradient` rendu comme `View`), `@react-native-community/slider` (un composant qui expose ses props via `testID="seek-slider"`), `react-native-reanimated` (le mock officiel `react-native-reanimated/mock` s'il est disponible, sinon un mock minimal) et `@/contexts/PlayerContext` comme en Task 1.

```tsx
describe('PlayerModal without a track', () => {
	beforeEach(() => {
		usePlayerStore.setState({ currentTrack: null, playbackState: 'idle', isModalOpen: true });
	});

	it('renders the empty state with disabled controls', () => {
		render(<PlayerModal />);
		expect(screen.getByText('Rien en lecture')).toBeTruthy();
		expect(screen.getByTestId('seek-slider').props.disabled).toBe(true);
		for (const label of ['Previous track', 'Play', 'Next track']) {
			expect(screen.getByLabelText(label).props.accessibilityState?.disabled).toBe(true);
		}
	});

	it('keeps the queue button working', () => {
		render(<PlayerModal />);
		fireEvent.press(screen.getByLabelText('Queue'));
		expect(screen.getByText(/file de lecture|Queue/i)).toBeTruthy();
	});

	it('asks for no artwork colors and keeps the theme colors', () => {
		render(<PlayerModal />);
		expect(useImageColors).toHaveBeenCalledWith(null, expect.anything());
	});
});
```

Avant d'écrire le test du bouton Queue, lire dans `PlayerModal.tsx` l'`accessibilityLabel` actuel du bouton qui ouvre `QueueModal` et le titre que `QueueModal` affiche, et utiliser ces textes exacts (ajouter `accessibilityLabel="Queue"` au bouton s'il n'en a pas). Le bouton play reçoit `accessibilityLabel={isPlaying ? 'Pause' : 'Play'}`.

Run: `npx jest src/components/player/PlayerModal.test.tsx` — FAIL (la modale renvoie `null`).

- [ ] **Step 2: Implémenter**

Retirer le `if (!currentTrack) return null;`. Sans `currentTrack` :
- `displayArtwork` devient une vue neutre de la taille de la pochette, avec l'icône `musical-notes` (64 px) ;
- titre « Rien en lecture », sous-titre « Choisis un son pour commencer » ;
- slider `disabled` à 0 ;
- précédent, play et suivant `disabled` ;
- le bouton Queue reste actif.

Les gestes de fermeture (swipe) et le bouton de fermeture marchent comme avant. Garder les changements locaux : pas de déplacement de blocs existants, pour que la PR parallèle de #295 (qui modifie `handleSeek`) fusionne sans conflit.

Run: `npm test && npm run type-check && npm run lint` — PASS.

- [ ] **Step 3: Commit** — `feat(mobile): player modal works without a track`

---

### Task 3: Vérification et PR

- [ ] `cd mobile && npm test && npm run type-check && npm run lint` (dans le worktree).
- [ ] PR vers `develop` (`--assignee @me`), corps : résumé, captures non requises, « Mode télécommande : #297 », attribution Claude Code.
- [ ] CI verte → merge dans `develop` → fermer #296 à la main → `git worktree remove ../music-room-296`.
