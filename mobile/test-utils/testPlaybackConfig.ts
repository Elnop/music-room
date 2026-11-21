import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import type {
	PlaybackActions,
	PlaylistPlayback,
} from '@/shared/playback/types/playbackActionsTypes';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';

export const testPlayback = {
	playingUri: null as PlaylistPlayback['playingUri'],
	state: null as PlaylistPlayback['state'],
	addToQueue: jest.fn((_track: AddQueueItemBody) => Promise.resolve(true)),
	playNext: jest.fn((_track: AddQueueItemBody) => Promise.resolve(true)),
	playPlaylist: jest.fn((_playlistId: string, _startTrackId?: string) => Promise.resolve('played')),
	playListTrack: jest.fn((_track: SoundCloudTrack) => Promise.resolve()),
	pause: jest.fn(),
	resume: jest.fn(),
} satisfies PlaybackActions & PlaylistPlayback;
