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
	/** The user whose queue this is. */
	ownerId: string;
	/** Grows with every change of the queue; the store drops a state not newer than its own (#285). */
	version: number;
	currentItemId: string | null;
	items: QueueItem[];
}

/**
 * Body of `POST /api/queue/items`: the backend `addQueueItemBodySchema`, i.e. a
 * playlist add's track without `previewUrl` (stream URLs are never stored),
 * plus `next` (#316) to place it right after the current item instead of last.
 */
export interface AddQueueItemBody {
	trackUri: string;
	title: string;
	artist: string;
	album?: string;
	albumArt?: string;
	durationMs: number;
	next?: boolean;
}

/** 409 codes of `POST /api/queue/next` and `/previous`. */
export type QueueStepBoundary = 'QUEUE_END' | 'QUEUE_START';

/** Outcome of a step: the new state, or the boundary the queue hit. */
export type QueueStepResult =
	{ ok: true; state: QueueState } | { ok: false; code: QueueStepBoundary };

/**
 * Body of `POST /api/queue/transfer` (#295): move what plays to another device.
 * `playing.queueItemId` is an item of my own queue; `playing.track` is for what a
 * friend's device plays. `source` is the remote device that plays now, to be paused.
 */
export interface TransferRequest {
	targetUserId: string;
	targetDeviceId: string;
	positionMs: number;
	playing: { queueItemId: string } | { track: AddQueueItemBody };
	source?: { userId: string; deviceId: string };
}

/** Answer of `POST /api/queue/transfer`; `queue` is the target's new queue when it changed, else null. */
export interface TransferResult {
	ownerId: string;
	deviceId: string;
	queue: QueueState | null;
}

/** control:command: play `item` from `positionMs` on the device (queue playback, #294). */
export interface QueuePlayCommand {
	action: 'play-item';
	fromUserId: string;
	item: QueueItem;
	positionMs: number;
	/** Version of the queue state that made `item` current. */
	version: number;
}

/** control:command: play `track` from `positionMs` (playback transfer, #295). */
export interface QueueTrackCommand {
	action: 'play-track';
	fromUserId: string;
	track: QueueTrack;
	positionMs: number;
}

/** control:command: pause the device (playback transfer, #295). */
export interface DevicePauseCommand {
	action: 'pause';
	fromUserId: string;
}

export type DeviceCommand = QueuePlayCommand | QueueTrackCommand | DevicePauseCommand;
