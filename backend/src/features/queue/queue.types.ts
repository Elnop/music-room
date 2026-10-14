/**
 * Play queue types (#273): one queue per user, shared by all of their devices.
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
 * is upcoming. Every endpoint returns it, and `queue:updated` carries it.
 */
export interface QueueState {
	currentItemId: string | null;
	items: QueueItem[];
}

export type QueueStepDirection = 'next' | 'previous';
