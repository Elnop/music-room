import type { AddQueueItemBody, QueueItem, QueueTrack } from '@/shared/types/playback';

export type { AddQueueItemBody, QueueItem, QueueTrack };

// Mirrors backend `features/queue/queue.types.ts`. One queue per user, shared by all of their devices.

/** Items before the current one are history, after it upcoming; all upcoming when `currentItemId` is null. */
export interface QueueState {
	ownerId: string;
	/** Grows with every change of the queue; the store drops a state not newer than its own. */
	version: number;
	currentItemId: string | null;
	items: QueueItem[];
}

/** 409 codes of `POST /api/queue/next` and `/previous`. */
export type QueueStepBoundary = 'QUEUE_END' | 'QUEUE_START';

/** Outcome of a step: the new state, or the boundary the queue hit. */
export type QueueStepResult =
	{ ok: true; state: QueueState } | { ok: false; code: QueueStepBoundary };

// `playing.queueItemId` is an item of my own queue, `playing.track` what a friend's device plays;
// `source` is the remote device playing now, to be paused.
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

/** control:command: play `item` from `positionMs` on the device. */
export interface QueuePlayCommand {
	action: 'play-item';
	fromUserId: string;
	item: QueueItem;
	positionMs: number;
	/** Version of the queue state that made `item` current. */
	version: number;
}

/** control:command: play `track` from `positionMs` (playback transfer). */
export interface QueueTrackCommand {
	action: 'play-track';
	fromUserId: string;
	track: QueueTrack;
	positionMs: number;
}

/** control:command: pause the device (playback transfer). */
export interface DevicePauseCommand {
	action: 'pause';
	fromUserId: string;
}

export type DeviceCommand = QueuePlayCommand | QueueTrackCommand | DevicePauseCommand;
