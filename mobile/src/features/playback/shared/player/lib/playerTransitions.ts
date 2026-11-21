import { initialPlayerState } from '@/features/playback/shared/player/configs/playerStateConfig';
import type { PlayerState } from '@/features/playback/shared/player/types/playerStateTypes';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';

type TrackStart = {
	track: SoundCloudTrack;
	queueItemId: string | null;
	startPositionMs: number | null;
};

export function validPos(p: number | null) {
	return p !== null && Number.isFinite(p) && p > 0 ? p : null;
}

export function playTrackPatch(state: PlayerState, start: TrackStart): Partial<PlayerState> {
	return {
		currentTrack: start.track,
		queueItemId: start.queueItemId,
		startPositionMs: validPos(start.startPositionMs),
		pendingTrackId: start.track.id,
		loadCounter: state.loadCounter + 1,
		playbackState: 'loading',
		streamUrl: null,
		streamExpiresAt: null,
		streamRenewed: false,
		resumeAfterLoad: true,
		pausedBySystem: false,
		needsStreamLoad: false,
		isPlaying: false,
		loading: true,
		isModalOpen: start.queueItemId === null ? false : state.isModalOpen,
		error: null,
	};
}

export function renewStreamPatch(
	state: PlayerState,
	positionMs: number,
	options: { keepPlaying: boolean; afterFailure: boolean }
): Partial<PlayerState> {
	return {
		startPositionMs: validPos(positionMs),
		pendingTrackId: state.currentTrack?.id ?? null,
		loadCounter: state.loadCounter + 1,
		playbackState: 'loading',
		streamUrl: null,
		streamExpiresAt: null,
		streamRenewed: options.afterFailure || state.streamRenewed,
		resumeAfterLoad: options.keepPlaying,
		pausedBySystem: false,
		isPlaying: options.keepPlaying,
		loading: true,
		error: null,
	};
}

export function restoreTrackPatch(state: PlayerState, start: TrackStart): Partial<PlayerState> {
	return {
		...initialPlayerState,
		currentTrack: start.track,
		queueItemId: start.queueItemId,
		startPositionMs: validPos(start.startPositionMs),
		playbackState: 'paused',
		needsStreamLoad: true,
		loadCounter: state.loadCounter,
	};
}
