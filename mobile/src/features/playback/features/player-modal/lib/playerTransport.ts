import type { usePlaybackControls } from '@/features/playback/shared/player/hooks/usePlaybackControls';
import type {
	PlayerTransportActions,
	PlayerTransportState,
} from '@/features/playback/features/player-modal/playerModalTypes';

type PlaybackControls = ReturnType<typeof usePlaybackControls>;

export function playerTransport(controls: PlaybackControls): PlayerTransportState {
	return {
		isPlaying: controls.nowPlaying.isPlaying,
		isLoading: controls.nowPlaying.isLoading,
		canGoPrevious: controls.canGoPrevious,
		canGoNext: controls.canGoNext,
		playDisabled: controls.playDisabled,
	};
}

export function playerTransportActions(controls: PlaybackControls): PlayerTransportActions {
	return {
		onPrevious: controls.handlePrevious,
		onPlayPause: controls.handlePlayPause,
		onNext: controls.handleNext,
	};
}
