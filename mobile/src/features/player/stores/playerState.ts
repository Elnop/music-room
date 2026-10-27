import type { SoundCloudTrack, StreamProtocol } from '@/types/soundcloud.types';
import type { PlaybackState } from '@/shared/types/playback';

export interface PlayerState {
	currentTrack: SoundCloudTrack | null;
	streamUrl: string | null;
	streamProtocol: StreamProtocol;
	pendingTrackId: number | null;
	loadCounter: number;
	queueItemId: string | null;
	startPositionMs: number | null;
	streamExpiresAt: number | null;
	streamRenewed: boolean;
	resumeAfterLoad: boolean;
	pausedBySystem: boolean;
	needsStreamLoad: boolean;

	playbackState: PlaybackState;

	// Derived from playbackState, kept for legacy callers
	isPlaying: boolean;
	loading: boolean;
	error: string | null;

	isModalOpen: boolean;
	seekCount: number;

	setStreamUrl: (url: string | null, expiresAt?: number | null, protocol?: StreamProtocol) => void;
	setTrackUnavailableError: (message: string) => void;
	clearError: () => void;
	setPlaybackReady: () => void;
	setPlaybackPlaying: () => void;
	playTrack: (
		track: SoundCloudTrack,
		queueItemId?: string | null,
		startPositionMs?: number | null
	) => void;
	renewStream: (positionMs: number, keepPlaying: boolean, afterFailure?: boolean) => void;
	restoreTrack: (track: SoundCloudTrack, queueItemId: string | null, positionMs: number) => void;
	setRestoredPosition: (positionMs: number) => void;
	play: () => void;
	pause: () => void;
	pauseBySystem: () => void;
	resume: () => void;
	stop: () => void;
	toggleModal: () => void;
	setModalOpen: (isOpen: boolean) => void;
	markSeek: () => void;
}

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
