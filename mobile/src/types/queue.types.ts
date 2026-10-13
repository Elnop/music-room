/**
 * Play queue types, mirroring backend `features/queue/queue.types.ts` (#273).
 * One queue per user, shared by all of their devices.
 */

/** Track metadata of a queue item; `trackUri` is the SoundCloud permalink. */
export interface QueueTrack {
	trackUri: string;
	title: string;
	artist: string;
	album: string | null;
	albumArt: string | null;
	durationMs: number;
}

export interface QueueItem {
	id: string;
	rank: string;
	track: QueueTrack;
	sourcePlaylistId: string | null;
	/** Items queued together from one playlist share a block. */
	blockId: string | null;
	/** True once the user removed or moved an item of the block. */
	blockDetached: boolean;
}

/**
 * The whole queue, items in rank order. Items ranked before the current one
 * are history, those after it upcoming; with `currentItemId` null every item
 * is upcoming. Every queue endpoint returns it, and `queue:updated` carries it.
 */
export interface QueueState {
	currentItemId: string | null;
	items: QueueItem[];
}

/**
 * Body of `POST /api/queue/items`: the backend `addQueueItemSchema`, i.e. a
 * playlist add's track without `previewUrl` (stream URLs are never stored).
 */
export interface AddQueueItemBody {
	trackUri: string;
	title: string;
	artist: string;
	album?: string;
	albumArt?: string;
	durationMs: number;
}

/** 409 codes of `POST /api/queue/next` and `/previous`. */
export type QueueStepBoundary = 'QUEUE_END' | 'QUEUE_START';

/** Outcome of a step: the new state, or the boundary the queue hit. */
export type QueueStepResult =
	{ ok: true; state: QueueState } | { ok: false; code: QueueStepBoundary };
