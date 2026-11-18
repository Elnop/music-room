import type { AddQueueItemBody, QueueItem, QueueTrack } from '@/shared/types/playback';

export type { AddQueueItemBody, QueueItem, QueueTrack };

// Mirrors backend `features/queue/queue.types.ts`.

/** Items before the current one are history; all are upcoming when `currentItemId` is null. */
export interface QueueState {
	ownerId: string;
	/** Grows with every change; the store drops a state not newer than its own. */
	version: number;
	currentItemId: string | null;
	items: QueueItem[];
}

export type QueueStepBoundary = 'QUEUE_END' | 'QUEUE_START';

export type QueueStepResult =
	{ ok: true; state: QueueState } | { ok: false; code: QueueStepBoundary };

// `queueItemId`: an item of my queue; `track`: what a friend's device plays; `source`: the device to pause.
export interface TransferRequest {
	targetUserId: string;
	targetDeviceId: string;
	positionMs: number;
	playing: { queueItemId: string } | { track: AddQueueItemBody };
	source?: { userId: string; deviceId: string };
}

/** `queue` is null when the target's queue did not change. */
export interface TransferResult {
	ownerId: string;
	deviceId: string;
	queue: QueueState | null;
}

export interface QueuePlayCommand {
	action: 'play-item';
	fromUserId: string;
	item: QueueItem;
	positionMs: number;
	version: number;
}

export interface QueueTrackCommand {
	action: 'play-track';
	fromUserId: string;
	track: QueueTrack;
	positionMs: number;
}

export interface DevicePauseCommand {
	action: 'pause';
	fromUserId: string;
}

export type DeviceCommand = QueuePlayCommand | QueueTrackCommand | DevicePauseCommand;
