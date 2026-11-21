import type { PlayerSheets } from '@/features/playback/shared/full-screen-sheet/playerSheetsTypes';
import type { NowPlayingTrack } from '@/features/playback/shared/player/types/playerTypes';
import type { AddQueueItemBody, QueueItem } from '@/shared/playback/types/playbackTypes';
import type {
	TrackActionsSheetComponent,
	TrackActionsStart,
} from '@/shared/playback/types/trackActionsSheetTypes';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';
import type { toTrackInput } from '@/shared/tracks/lib/toTrackInput';

export type PanelSheetComponents = PlayerSheets & {
	TrackActionsSheet: TrackActionsSheetComponent;
};

export type PanelTrackSource = Parameters<typeof toTrackInput>[0];

export type PanelUpNext = {
	items: QueueItem[];
	total: number;
	source: PanelTrackSource | null;
};

export type PanelArtwork = {
	artworkUrl: string | null;
	gradient: readonly [string, string];
};

export type PanelNavigation = {
	onClose: () => void;
	isQueueOpen: boolean;
	isDevicesOpen: boolean;
	onOpenQueue: () => void;
	onOpenDevices: () => void;
	onCloseSheet: () => void;
};

export type PanelOpenActions = {
	track: AddQueueItemBody;
	start: TrackActionsStart;
};

export type PanelTrackActions = {
	actions: PanelOpenActions | null;
	shareUrl: string | null;
	onAddToPlaylist: (anchor?: MenuAnchor) => void;
	onMoreActions: (anchor?: MenuAnchor) => void;
	onCloseActions: () => void;
};

export type NowPlayingPanelData = PanelArtwork &
	PanelNavigation &
	PanelTrackActions & {
		track: NowPlayingTrack | null;
		deviceLabel: string;
		isRemote: boolean;
		upNext: QueueItem[];
		upNextTotal: number;
		onPlayItem: (itemId: string) => void;
	};
