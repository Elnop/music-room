import { create } from 'zustand';
import { ApiError } from '@/services/api';
import { queueApi, type QueueCallTarget } from '@/services/queueApi';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@store/authStore';
import { useConnectStore, useActiveOwnerId } from '@/store/connectStore';
import { trackToSoundCloud } from '@utils/trackToSoundCloud';
import { toTrackInput } from '@utils/trackInput';
import { showError, showInfo, showSuccess } from '@utils/toast';
import type { AddQueueItemBody, QueueItem, QueueState, QueueStepResult } from '@/types/queue.types';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

/** Past this many seconds played, "previous" restarts the track instead. */
export const RESTART_THRESHOLD_S = 3;

/** What the previous button does at `currentTime` seconds into the track. */
export function previousAction(currentTime: number, hasPrevious: boolean): 'restart' | 'previous' {
	return currentTime > RESTART_THRESHOLD_S || !hasPrevious ? 'restart' : 'previous';
}

/**
 * Outcome of a step: the new current item plays, the queue has no current
 * item left (playback stopped when asked), at a queue boundary, failed, or
 * ignored because another step was still pending.
 */
export type QueueStepOutcome = 'played' | 'stopped' | 'boundary' | 'error' | 'ignored';

/** True while a request that changes the current item is in flight. */
let stepPending = false;

interface StepOptions {
	/** Toast shown when the request fails, or built from the error; none for next/previous. */
	errorMessage?: string | ((error: unknown) => string);
	/** Stop playback when the returned queue has no current item. */
	stopWhenEmpty?: boolean;
}

/** One owner's queue as the store holds it. */
export interface OwnerQueue {
	currentItemId: string | null;
	items: QueueItem[];
	/** Version of the state held (#285). */
	version: number;
}

interface QueueStoreState {
	/** Queues by owner id: mine, and the remote owner's while the phone drives one of their devices (#297). */
	queues: Record<string, OwnerQueue>;
	/** True once a server queue was read at least once. */
	loaded: boolean;
	/** Read a queue: `ownerId`'s, or mine when omitted. */
	load: (ownerId?: string) => Promise<void>;
	/** Store a state under its owner unless its version is not above the one held. */
	applyState: (state: QueueState) => void;
	/**
	 * Mark `itemId` current in `ownerId`'s queue, as a `play-item` command
	 * says, unless a state at least as new as `version` is held already. The
	 * version is not taken: the `queue:updated` of that version still applies.
	 */
	setCurrentItem: (ownerId: string, itemId: string, version: number) => void;
	/** Drop an owner's queue (the phone left remote mode on a friend's device). */
	forget: (ownerId: string) => void;
	reset: () => void;
	/** Step to the next item and play it; at the queue end, stop playback. */
	next: () => Promise<QueueStepOutcome>;
	/** Step to the previous item and play it; nothing happens at the queue start. */
	previous: () => Promise<QueueStepOutcome>;
	/**
	 * Append a track to the end of the queue and toast the outcome; resolves
	 * true once added. Never changes what is playing.
	 */
	addItem: (track: AddQueueItemBody) => Promise<boolean>;
	/** Make an item current and play it (on this device, or on the remote one). */
	playItem: (itemId: string) => Promise<QueueStepOutcome>;
	/**
	 * Remove an item; resolves true once the server removed it. Removing the
	 * item this device plays starts the item the server makes current, or
	 * stops playback when none is left; otherwise playback is untouched.
	 */
	removeItem: (itemId: string) => Promise<boolean>;
	/** Move an upcoming item after `afterItemId` (null = right after the current item). */
	moveItem: (itemId: string, afterItemId: string | null) => Promise<boolean>;
	/**
	 * Queue a playlist as a block after the current item and play its first
	 * track (#277), on this device or on the remote one.
	 */
	playPlaylist: (playlistId: string) => Promise<QueueStepOutcome>;
	/**
	 * A track tapped in a list: plays on this phone in local mode; in remote
	 * mode it is transferred to the targeted device and the phone stays silent.
	 */
	playListTrack: (track: SoundCloudTrack) => Promise<void>;
}

type QueueItemsView = Pick<QueueState, 'currentItemId' | 'items'>;

/** The queue of an owner not loaded (yet): stable, so selectors do not re-render. */
export const EMPTY_QUEUE: OwnerQueue = Object.freeze({
	currentItemId: null,
	items: [],
	version: 0,
}) as OwnerQueue;

const currentIndex = (state: QueueItemsView): number =>
	state.currentItemId === null
		? -1
		: state.items.findIndex(item => item.id === state.currentItemId);

/** An owner's queue, or `EMPTY_QUEUE`. */
export const selectQueue = (state: Pick<QueueStoreState, 'queues'>, ownerId: string | null) =>
	(ownerId !== null && state.queues[ownerId]) || EMPTY_QUEUE;

/** The queue the player shows and acts on: the remote owner's, else mine. */
export function useActiveQueue(): OwnerQueue {
	const ownerId = useActiveOwnerId();
	return useQueueStore(state => selectQueue(state, ownerId));
}

/** An upcoming item exists (with nothing current, every item is upcoming). */
export const selectHasNext = (state: QueueItemsView): boolean =>
	currentIndex(state) < state.items.length - 1;

/** A history item exists before the current one. */
export const selectHasPrevious = (state: QueueItemsView): boolean => currentIndex(state) > 0;

const currentItem = (state: QueueItemsView): QueueItem | undefined =>
	state.items.find(item => item.id === state.currentItemId);

/**
 * The queue item this device plays (`playerStore.queueItemId`) was queued from
 * `playlistId`. False for a list-tapped track or an item no longer in the queue.
 */
export const selectPlaysPlaylist = (
	state: QueueItemsView,
	queueItemId: string | null,
	playlistId: string
): boolean =>
	queueItemId !== null &&
	state.items.some(item => item.id === queueItemId && item.sourcePlaylistId === playlistId);

/** French toast for a failed play-playlist request. */
const playPlaylistError = (error: unknown): string => {
	if (error instanceof ApiError) {
		if (error.code === 'PLAYLIST_EMPTY') return 'Cette playlist est vide';
		if (error.code === 'PLAYLIST_ACCESS_DENIED') return "Vous n'avez pas accès à cette playlist";
		if (error.code === 'PLAYLIST_NOT_FOUND') return "Cette playlist n'existe plus";
	}
	return 'Impossible de lire cette playlist';
};

/** Who an action acts on: the queue owner, whether a remote device plays, and the API target. */
interface ActionScope {
	ownerId: string | null;
	remote: boolean;
	call: QueueCallTarget;
}

const actionScope = (): ActionScope => {
	const { target } = useConnectStore.getState();
	const me = useAuthStore.getState().user?.id ?? null;
	if (target.kind === 'local') return { ownerId: me, remote: false, call: {} };
	return {
		ownerId: target.ownerId,
		remote: true,
		call: {
			ownerId: target.ownerId === me ? undefined : target.ownerId,
			deviceId: target.deviceId,
		},
	};
};

/**
 * In remote mode, a refusal about the target (device offline, access gone)
 * toasts and brings the player back to this phone. True when handled.
 */
const handleRemoteRefusal = (scope: ActionScope, error: unknown): boolean => {
	if (!scope.remote || !(error instanceof ApiError)) return false;
	if (error.code === 'DEVICE_OFFLINE') {
		showError("Cet appareil n'est plus en ligne");
	} else if (error.code === 'QUEUE_ACCESS_DENIED') {
		showError('Vous ne pouvez plus contrôler cet appareil');
	} else {
		return false;
	}
	useConnectStore.getState().setLocal();
	return true;
};

/**
 * Mirror of the server play queues (#274), one per owner (#297): mine, and a
 * friend's while the phone drives one of their devices. `queue:updated` and
 * every action replace an owner's queue whole, unless they carry a version not
 * above the one held for that owner (#285). Actions act on the active owner
 * (`connectStore`). In local mode, actions that change the current item (next /
 * previous, play or remove an item, #276, play a playlist, #277) start this
 * device's audio; in remote mode the targeted device plays and the phone
 * stays silent. An event never starts audio. Stream URLs are fetched by the
 * player on demand, never kept here.
 */
export const useQueueStore = create<QueueStoreState>((set, get) => {
	/**
	 * Run a step, apply the returned state and play its current item. A track
	 * started elsewhere while the request ran (a list tap) wins over the step.
	 */
	const runStep = async (
		request: (call: QueueCallTarget) => Promise<QueueStepResult>,
		label: string,
		{ errorMessage, stopWhenEmpty = false }: StepOptions = {}
	): Promise<QueueStepOutcome> => {
		// One step at a time: a second tap would move the server queue twice.
		if (stepPending) return 'ignored';
		stepPending = true;
		const scope = actionScope();
		const loadCounter = usePlayerStore.getState().loadCounter;
		let result: QueueStepResult;
		try {
			result = await request(scope.call);
		} catch (error) {
			console.error(`[queueStore] ${label} failed:`, error);
			if (!handleRemoteRefusal(scope, error) && errorMessage) {
				showError(typeof errorMessage === 'function' ? errorMessage(error) : errorMessage);
			}
			return 'error';
		} finally {
			stepPending = false;
		}
		if (!result.ok) return 'boundary';

		get().applyState(result.state);
		const item = currentItem(result.state);
		// The remote device plays the new current item itself.
		if (scope.remote) return item ? 'played' : 'stopped';
		const player = usePlayerStore.getState();
		if (player.loadCounter !== loadCounter) return 'played';
		if (item) {
			player.playTrack(trackToSoundCloud(item), item.id);
			return 'played';
		}
		if (stopWhenEmpty) player.stop();
		return 'stopped';
	};

	/** A queue request that returns the whole state, as a step result. */
	const asStep =
		(request: (call: QueueCallTarget) => Promise<QueueState>) =>
		async (call: QueueCallTarget): Promise<QueueStepResult> => ({
			ok: true,
			state: await request(call),
		});

	/** Run a request that returns the active owner's whole state; false on failure. */
	const mutate = async (
		request: (call: QueueCallTarget) => Promise<QueueState>,
		label: string,
		errorMessage: string | ((error: unknown) => string)
	): Promise<boolean> => {
		const scope = actionScope();
		try {
			get().applyState(await request(scope.call));
			return true;
		} catch (error) {
			console.error(`[queueStore] ${label} failed:`, error);
			if (!handleRemoteRefusal(scope, error)) {
				showError(typeof errorMessage === 'function' ? errorMessage(error) : errorMessage);
			}
			return false;
		}
	};

	return {
		queues: {},
		loaded: false,

		load: async ownerId => {
			const me = useAuthStore.getState().user?.id;
			try {
				get().applyState(await queueApi.getQueue(ownerId && ownerId !== me ? { ownerId } : {}));
			} catch (error) {
				console.error('[queueStore] Load failed:', error);
			}
		},

		applyState: state => {
			// Only my queue and the remote owner's are kept: a late answer after
			// forget() or a logout must not bring another owner's queue back.
			const me = useAuthStore.getState().user?.id;
			const { target } = useConnectStore.getState();
			const remoteOwner = target.kind === 'remote' ? target.ownerId : null;
			if (state.ownerId !== me && state.ownerId !== remoteOwner) return;
			// Answers and queue:updated events can arrive out of commit order (#285).
			const held = get().queues[state.ownerId];
			if (held && state.version <= held.version) return;
			set(current => ({
				queues: {
					...current.queues,
					[state.ownerId]: {
						currentItemId: state.currentItemId,
						items: state.items,
						version: state.version,
					},
				},
				loaded: true,
			}));
		},

		setCurrentItem: (ownerId, itemId, version) => {
			const held = get().queues[ownerId];
			if (!held || held.version >= version || held.currentItemId === itemId) return;
			if (!held.items.some(item => item.id === itemId)) return;
			set(current => ({
				queues: { ...current.queues, [ownerId]: { ...held, currentItemId: itemId } },
			}));
		},

		forget: ownerId => {
			if (!(ownerId in get().queues)) return;
			set(current => {
				const queues = { ...current.queues };
				delete queues[ownerId];
				return { queues };
			});
		},

		reset: () => {
			set({ queues: {}, loaded: false });
		},

		next: async () => {
			const outcome = await runStep(call => queueApi.next(call), 'Next');
			if (outcome === 'boundary' && useConnectStore.getState().target.kind === 'local') {
				usePlayerStore.getState().stop();
			}
			return outcome;
		},

		previous: () => runStep(call => queueApi.previous(call), 'Previous'),

		addItem: async track => {
			const added = await mutate(
				call => queueApi.addItem(track, call),
				'Add',
				error =>
					error instanceof Error && error.message
						? error.message
						: "Impossible d'ajouter à la file de lecture"
			);
			if (added) showSuccess('Ajouté à la file de lecture');
			return added;
		},

		playItem: itemId =>
			runStep(
				asStep(call => queueApi.playItem(itemId, call)),
				'Play item',
				{ errorMessage: 'Impossible de lire ce titre' }
			),

		removeItem: async itemId => {
			const errorMessage = 'Impossible de retirer ce titre';
			// Removing the item this device plays changes what it plays: it goes
			// through the step guard. A list-tapped track or another item keeps playing.
			if (
				useConnectStore.getState().target.kind === 'local' &&
				usePlayerStore.getState().queueItemId === itemId
			) {
				const outcome = await runStep(
					asStep(call => queueApi.removeItem(itemId, call)),
					'Remove current item',
					{ errorMessage, stopWhenEmpty: true }
				);
				if (outcome === 'ignored') showInfo('Une action est déjà en cours');
				return outcome === 'played' || outcome === 'stopped';
			}
			return mutate(call => queueApi.removeItem(itemId, call), 'Remove item', errorMessage);
		},

		moveItem: (itemId, afterItemId) =>
			mutate(
				call => queueApi.moveItem(itemId, afterItemId, call),
				'Move item',
				'Impossible de déplacer ce titre'
			),

		playPlaylist: playlistId =>
			runStep(
				asStep(call => queueApi.playPlaylist(playlistId, call)),
				'Play playlist',
				{ errorMessage: playPlaylistError }
			),

		playListTrack: async track => {
			const { target } = useConnectStore.getState();
			if (target.kind === 'local') {
				usePlayerStore.getState().playTrack(track);
				return;
			}
			const scope = actionScope();
			try {
				const result = await queueApi.transfer({
					targetUserId: target.ownerId,
					targetDeviceId: target.deviceId,
					positionMs: 0,
					playing: { track: toTrackInput(track) },
				});
				if (result.queue) get().applyState(result.queue);
			} catch (error) {
				console.error('[queueStore] Play list track on remote device failed:', error);
				if (!handleRemoteRefusal(scope, error)) showError('Impossible de lire ce titre');
			}
		},
	};
});
