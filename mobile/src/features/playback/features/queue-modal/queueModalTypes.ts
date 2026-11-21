import type { QueueItem } from '@/features/playback/shared/player/types/queueTypes';
import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';

export type QueueSplit = {
	current: QueueItem | null;
	upcoming: QueueItem[];
};

export type QueueListState = QueueSplit & {
	isMoving: boolean;
	onReorder: (from: number, to: number) => Promise<void>;
};

export type QueueRowActions = {
	onPlay: (itemId: string) => void;
	onRemove: (itemId: string) => Promise<boolean>;
	onShowActions: (item: QueueItem, anchor?: MenuAnchor) => void;
};

export type QueueRowDrag = {
	onDragStart?: () => void;
	isDragActive: boolean;
};

export type QueueActionSheet = {
	track: AddQueueItemBody | null;
	onClose: () => void;
};
