import type { AddQueueItemBody, PlaybackState } from './playback';
import type { SoundCloudTrack } from '@/shared/tracks/lib/soundcloud.types';

export interface PlaybackActions {
	addToQueue: (track: AddQueueItemBody) => Promise<boolean>;
	playNext: (track: AddQueueItemBody) => Promise<boolean>;
	playListTrack: (track: SoundCloudTrack) => Promise<void>;
	playPlaylist: (playlistId: string, startTrackId?: string) => Promise<string>;
	pause: () => void;
	resume: () => void;
}

export interface PlaylistPlayback {
	playingUri: string | null;
	state: PlaybackState | null;
}
