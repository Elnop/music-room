import type { AddQueueItemBody, QueueItem, QueueTrack } from '@/shared/types/playback';

export type { AddQueueItemBody, QueueItem, QueueTrack };

export interface QueueState {
	ownerId: string;
	version: number;
	currentItemId: string | null;
	items: QueueItem[];
}

export type QueueStepBoundary = 'QUEUE_END' | 'QUEUE_START';

export type QueueStepResult =
	{ ok: true; state: QueueState } | { ok: false; code: QueueStepBoundary };

export interface TransferRequest {
	targetUserId: string;
	targetDeviceId: string;
	positionMs: number;
	playing: { queueItemId: string } | { track: AddQueueItemBody };
	source?: { userId: string; deviceId: string };
}

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
