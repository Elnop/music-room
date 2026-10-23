/**
 * Types of the playback contract (`shared/services/playbackBridge.ts`), shared
 * by the player, the queue and the features that start playback.
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

/**
 * Playback states of the player state machine
 * - idle: No track loaded
 * - loading: Track selected, stream being fetched
 * - ready: Stream loaded, ready to play (transitions to playing automatically)
 * - playing: Audio is playing
 * - paused: Audio is paused
 */
export type PlaybackState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused';

/** One owner's queue as the store holds it. */
export interface OwnerQueue {
	currentItemId: string | null;
	items: QueueItem[];
	/** Version of the state held (#285). */
	version: number;
}

/**
 * Outcome of a step: the new current item plays, the queue has no current
 * item left (playback stopped when asked), at a queue boundary, failed, or
 * ignored because another step was still pending.
 */
export type QueueStepOutcome = 'played' | 'stopped' | 'boundary' | 'error' | 'ignored';
