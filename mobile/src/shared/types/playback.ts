/** Types of the playback contract (`shared/services/playbackBridge.ts`). */

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

/** Body of a track added to the queue or to a playlist; mirrors the backend's queue input. */
export interface AddQueueItemBody {
	trackUri: string;
	title: string;
	artist: string;
	album?: string;
	albumArt?: string;
	durationMs: number;
	next?: boolean;
}

/** `ready` moves on to `playing` by itself. */
export type PlaybackState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused';

export interface OwnerQueue {
	currentItemId: string | null;
	items: QueueItem[];
	version: number;
}

/** `stopped`: no current item left; `ignored`: another step was still pending. */
export type QueueStepOutcome = 'played' | 'stopped' | 'boundary' | 'error' | 'ignored';
