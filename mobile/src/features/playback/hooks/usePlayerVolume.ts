import { useEffect } from 'react';
import { useVolumeState } from '@/features/playback/shared/volume/useVolumeState';
import type { AudioPlayer } from '@/features/playback/shared/player/types/playerTypes';

export function usePlayerVolume(player: AudioPlayer): void {
	const volume = useVolumeState(state => state.volume);
	const muted = useVolumeState(state => state.muted);

	useEffect(() => {
		player.volume = muted ? 0 : volume;
	}, [player, volume, muted]);
}
