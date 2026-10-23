import type {
	QueueItem,
	QueueState,
	QueueStepBoundary,
	QueueStepResult,
	TransferRequest,
	TransferResult,
} from '@/types/queue.types';
import type { ListeningStatus } from '@/types/listening.types';
import type { OwnerQueue, QueueStepOutcome } from '@/shared/types/playback';

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

export interface RemoteTarget {
	kind: 'remote';
	ownerId: string;
	deviceId: string;
	ownerUsername?: string;
}

export type ConnectTarget = { kind: 'local' } | RemoteTarget;

export interface QueueCallTarget {
	ownerId?: string;
	deviceId?: string;
}

export interface ActionScope {
	ownerId: string | null;
	remote: boolean;
	call: QueueCallTarget;
}
