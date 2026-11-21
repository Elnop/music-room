import type {
	QueueItem,
	QueueState,
	QueueStepBoundary,
	QueueStepResult,
	TransferRequest,
	TransferResult,
} from '@/shared/playback/types/queueTypes';
import type { ListeningStatus } from '@/features/playback/shared/player/lib/listening.types';
import type { OwnerQueue, QueueStepOutcome } from '@/shared/playback/types/playbackTypes';

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
