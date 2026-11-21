import type { MenuAnchor } from '@/shared/theme/types/menuTypes';

export type ActionSheetHeading = {
	title?: string;
	subtitle?: string;
	onBack?: () => void;
};

export type ActionSheetPlacement = {
	anchor?: MenuAnchor | null;
	tall?: boolean;
};

export type ActionSheetMode = 'menu' | 'dialog' | 'sheet';

export type PlaylistActionsMenu = {
	playlistName: string;
	hasCover: boolean;
	coverLocked: boolean;
	onEdit: () => void;
	onSharing: () => void;
	onDelete: () => void;
	onChangeCover: () => void;
	onRemoveCover: () => void;
};
