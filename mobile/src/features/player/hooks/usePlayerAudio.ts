import { useCallback, useEffect } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { usePlayerStore, setPositionReader } from '@/features/player/stores/playerStore';
import { useConnectStore } from '@/store/connectStore';
import { isStreamStale } from '@/features/player/services/streamPrefetch';
import { useStreamLoader } from './useStreamLoader';
import { useAudioPlaybackSync } from './useAudioPlaybackSync';

const playsLocally = () => useConnectStore.getState().target.kind === 'local';

interface PlayerAudio {
	player: ReturnType<typeof useAudioPlayer>;
	seekTo: (seconds: number) => void;
}

export function usePlayerAudio(): PlayerAudio {
	const streamUrl = usePlayerStore(state => state.streamUrl);
	const player = useAudioPlayer(streamUrl || '');

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
