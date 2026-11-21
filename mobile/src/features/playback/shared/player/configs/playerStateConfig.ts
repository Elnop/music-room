import type { StreamProtocol } from '@/shared/tracks/types/soundcloudTypes';
import type { PlaybackState } from '@/shared/playback/types/playbackTypes';

export const initialPlayerState = {
	currentTrack: null,
	streamUrl: null,
	streamProtocol: 'hls' as StreamProtocol,
	pendingTrackId: null,
	loadCounter: 0,
	queueItemId: null,
	startPositionMs: null,
	streamExpiresAt: null,
	streamRenewed: false,
	resumeAfterLoad: true,
	pausedBySystem: false,
	needsStreamLoad: false,
	playbackState: 'idle' as PlaybackState,
	isPlaying: false,
	loading: false,
	error: null,
	isModalOpen: false,
	seekCount: 0,
};
