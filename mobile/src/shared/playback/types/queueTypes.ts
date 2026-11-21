import type {
	AddQueueItemBody,
	QueueItem,
	QueueTrack,
} from '@/shared/playback/types/playbackTypes';

export type { AddQueueItemBody, QueueItem, QueueTrack };

export type QueueState = {
	ownerId: string;
	version: number;
	currentItemId: string | null;
	items: QueueItem[];
};

export type QueueStepBoundary = 'QUEUE_END' | 'QUEUE_START';

export type QueueStepResult =
	{ ok: true; state: QueueState } | { ok: false; code: QueueStepBoundary };

export type TransferRequest = {
	targetUserId: string;
	targetDeviceId: string;
	positionMs: number;
	playing: { queueItemId: string } | { track: AddQueueItemBody };
	source?: { userId: string; deviceId: string };
};

export type TransferResult = {
	ownerId: string;
	deviceId: string;
	queue: QueueState | null;
};

export type QueuePlayCommand = {
	action: 'play-item';
	fromUserId: string;
	item: QueueItem;
	positionMs: number;
	version: number;
};

export type QueueTrackCommand = {
	action: 'play-track';
	fromUserId: string;
	track: QueueTrack;
	positionMs: number;
};

export type DevicePauseCommand = {
	action: 'pause';
	fromUserId: string;
};

export type DeviceCommand = QueuePlayCommand | QueueTrackCommand | DevicePauseCommand;
