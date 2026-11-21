import type { AddQueueItemBody, PlaybackState } from '@/shared/playback/types/playbackTypes';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';

export type PlaybackActions = {
	addToQueue: (track: AddQueueItemBody) => Promise<boolean>;
	playNext: (track: AddQueueItemBody) => Promise<boolean>;
	playListTrack: (track: SoundCloudTrack) => Promise<void>;
	playPlaylist: (playlistId: string, startTrackId?: string) => Promise<string>;
	pause: () => void;
	resume: () => void;
};

export type PlaylistPlayback = {
	playingUri: string | null;
	state: PlaybackState | null;
};
