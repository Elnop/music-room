import { useCallback, useEffect } from 'react';
import { useAudioPlayer } from '@/features/playback/shared/player/lib/audioPlayer';
import { useAudioPlaybackSync } from '@/features/playback/shared/player/hooks/useAudioPlaybackSync';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import { useStreamLoader } from '@/features/playback/shared/player/hooks/useStreamLoader';
import { setPositionReader } from '@/features/playback/shared/player/lib/positionReader';
import { playerPositionMs, seekPlayer } from '@/features/playback/shared/player/lib/seekPlayer';
import type { AudioPlayer } from '@/features/playback/shared/player/types/playerTypes';

type PlayerAudio = {
	player: AudioPlayer;
	seekTo: (seconds: number) => void;
};

export function usePlayerAudio(): PlayerAudio {
	const streamUrl = usePlayerState(state => state.streamUrl);
	const streamProtocol = usePlayerState(state => state.streamProtocol);
	const player = useAudioPlayer(streamUrl || '', streamProtocol);

	useStreamLoader();
	useAudioPlaybackSync(player);

	useEffect(() => {
		setPositionReader(() => playerPositionMs(player));
		return () => setPositionReader(null);
	}, [player]);

	const seekTo = useCallback((seconds: number) => seekPlayer(player, seconds), [player]);

	return { player, seekTo };
}
