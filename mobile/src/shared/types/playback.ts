/**
 * Types of the playback contract (`shared/services/playbackBridge.ts`), shared
 * by the player, the queue and the features that start playback.
 */

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
