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
	blockId: string | null;
	blockDetached: boolean;
}

export interface AddQueueItemBody {
	trackUri: string;
	title: string;
	artist: string;
	album?: string;
	albumArt?: string;
	durationMs: number;
	next?: boolean;
}

export type PlaybackState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused';

export interface OwnerQueue {
	currentItemId: string | null;
	items: QueueItem[];
	version: number;
}

export type QueueStepOutcome = 'played' | 'stopped' | 'boundary' | 'error' | 'ignored';
