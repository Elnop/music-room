import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import type { TrackInPlaylist } from '@/shared/tracks/types/trackTypes';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';

export type PlaylistTracks = {
	canEdit: boolean;
	isMoving: boolean;
	currentUri: string | null;
	actionTrack: AddQueueItemBody | null;
	showActions: (track: TrackInPlaylist, anchor?: MenuAnchor) => void;
	closeActions: () => void;
	addToQueue: (track: TrackInPlaylist) => void;
	explainUnavailable: () => void;
	deleteTrack: (trackId: string) => Promise<void>;
	reorder: (from: number, to: number) => Promise<void>;
};
