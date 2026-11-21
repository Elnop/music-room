import type { MenuAnchor } from '@/shared/theme/types/menuTypes';

export type TrackItemState = {
	disabled?: boolean;
	isDragActive?: boolean;
	isCurrent?: boolean;
	isPending?: boolean;
	unavailable?: boolean;
};

export type TrackItemHandlers = {
	onDelete: (trackId: string) => Promise<void>;
	onAddToQueue?: () => void;
	onDragStart?: () => void;
	onShowActions?: (anchor?: MenuAnchor) => void;
	onPress?: () => void;
};

export type TrackRowState = {
	isCurrent: boolean;
	isPending: boolean;
	unavailable: boolean;
	isDragActive: boolean;
};

export type TrackRowActions = {
	onPress?: () => void;
	onShowActions?: (anchor?: MenuAnchor) => void;
	onDragStart?: () => void;
};
