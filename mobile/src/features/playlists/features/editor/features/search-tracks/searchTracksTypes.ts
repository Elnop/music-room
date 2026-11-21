import type { DebouncedText } from '@/features/playlists/features/editor/shared/debounced-text/debouncedTextTypes';
import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';

export type TrackResults = {
	results: SoundCloudTrack[];
	isLoading: boolean;
};

export type PlaylistAdds = {
	isAdded: (track: SoundCloudTrack) => boolean;
	add: (track: SoundCloudTrack) => void;
};

export type ResultActions = {
	addToQueue: (track: SoundCloudTrack) => void;
	actionTrack: AddQueueItemBody | null;
	showActions: (track: SoundCloudTrack, anchor?: MenuAnchor) => void;
	closeActions: () => void;
};

export type SearchTracks = TrackResults &
	PlaylistAdds &
	ResultActions & {
		search: DebouncedText;
	};

export type AddTracker = {
	sending: Set<string>;
	mark: (uri: string) => void;
	unmark: (uri: string) => void;
};

export type AddContext = {
	playlistId: string;
	tracker: AddTracker;
	mutate: (variables: { playlistId: string; track: AddQueueItemBody }) => Promise<void>;
};
