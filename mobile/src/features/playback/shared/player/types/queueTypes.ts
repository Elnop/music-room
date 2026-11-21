import type {
	QueueItem,
	QueueState,
	QueueStepBoundary,
	QueueStepResult,
	TransferRequest,
	TransferResult,
} from '@/shared/playback/types/queueTypes';
import type { ListeningStatus } from '@/features/playback/shared/player/types/listeningTypes';
import type {
	AddQueueItemBody,
	OwnerQueue,
	QueueStepOutcome,
} from '@/shared/playback/types/playbackTypes';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import type { StoreApi } from 'zustand';

export type {
	QueueItem,
	QueueState,
	QueueStepBoundary,
	QueueStepResult,
	TransferRequest,
	TransferResult,
	ListeningStatus,
	OwnerQueue,
	QueueStepOutcome,
};

export type RemoteTarget = {
	kind: 'remote';
	ownerId: string;
	deviceId: string;
	ownerUsername?: string;
};

export type ConnectTarget = { kind: 'local' } | RemoteTarget;

export type QueueCallTarget = {
	ownerId?: string;
	deviceId?: string;
};

export type ActionScope = {
	ownerId: string | null;
	remote: boolean;
	call: QueueCallTarget;
};

export type StepOptions = {
	errorMessage?: string | ((error: unknown) => string);
	stopWhenEmpty?: boolean;
};

export type ConnectState = {
	target: ConnectTarget;
	remoteStatus: ListeningStatus | null;
	controlPending: boolean;
	setRemote: (target: Omit<RemoteTarget, 'kind'>) => void;
	setLocal: (message?: string) => void;
	setRemoteStatus: (status: ListeningStatus | null) => void;
	setControlPending: (pending: boolean) => void;
};

export type QueueStoreState = {
	queues: Record<string, OwnerQueue>;
	loaded: boolean;
	load: (ownerId?: string) => Promise<void>;
	applyState: (state: QueueState) => void;
	setCurrentItem: (ownerId: string, itemId: string, version: number) => void;
	forget: (ownerId: string) => void;
	reset: () => void;
	next: () => Promise<QueueStepOutcome>;
	previous: () => Promise<QueueStepOutcome>;
	addItem: (track: AddQueueItemBody) => Promise<boolean>;
	playNext: (track: AddQueueItemBody) => Promise<boolean>;
	playItem: (itemId: string) => Promise<QueueStepOutcome>;
	removeItem: (itemId: string) => Promise<boolean>;
	moveItem: (itemId: string, afterItemId: string | null) => Promise<boolean>;
	playPlaylist: (playlistId: string, startTrackId?: string) => Promise<QueueStepOutcome>;
	playListTrack: (track: SoundCloudTrack) => Promise<void>;
};

export type QueueSet = StoreApi<QueueStoreState>['setState'];

export type QueueGet = StoreApi<QueueStoreState>['getState'];
