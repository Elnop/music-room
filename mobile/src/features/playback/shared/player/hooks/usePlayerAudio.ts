import { useCallback, useEffect } from 'react';
import { useAudioPlayer } from '@/features/playback/shared/player/lib/audioPlayer';
import type { AudioPlayer } from '@/features/playback/shared/player/lib/types';
import {
	usePlayerStore,
	setPositionReader,
} from '@/features/playback/shared/player/stores/playerStore';
import { isStreamStale } from '@/features/playback/shared/player/lib/streamPrefetch';
import { useStreamLoader } from '@/features/playback/shared/player/hooks/useStreamLoader';
import { useAudioPlaybackSync } from '@/features/playback/shared/player/hooks/useAudioPlaybackSync';
import { isLocalTarget } from '@/features/playback/shared/player/stores/connectStore';

function playsLocally() {
	return isLocalTarget();
}

type PlayerAudio = {
	player: AudioPlayer;
	seekTo: (seconds: number) => void;
};

export function usePlayerAudio(): PlayerAudio {
	const streamUrl = usePlayerStore(state => state.streamUrl);
	const streamProtocol = usePlayerStore(state => state.streamProtocol);
	const player = useAudioPlayer(streamUrl || '', streamProtocol);

	useStreamLoader();
	useAudioPlaybackSync(player);

	useEffect(() => {
		setPositionReader(() => {
			const { playbackState: state, startPositionMs, needsStreamLoad } = usePlayerStore.getState();
			if (needsStreamLoad) return startPositionMs ?? 0;
			if (state === 'loading' && startPositionMs !== null) return startPositionMs;
			return player.currentTime * 1000;
		});
		return () => setPositionReader(null);
	}, [player]);

	const seekTo = useCallback(
		(seconds: number) => {
			if (!player) return;
			const {
				playbackState: state,
				streamExpiresAt,
				renewStream,
				markSeek,
				needsStreamLoad,
				setRestoredPosition,
			} = usePlayerStore.getState();

			if (needsStreamLoad) {
				setRestoredPosition(seconds * 1000);
				markSeek();
				return;
			}
			const canRenew = state === 'playing' || state === 'paused';
			if (canRenew && isStreamStale(streamExpiresAt) && playsLocally()) {
				renewStream(seconds * 1000, state === 'playing');
				if (seconds <= 0) markSeek();
				return;
			}
			player.seekTo(seconds);
			markSeek();
		},
		[player]
	);

	return { player, seekTo };
}
