import { useEffect } from 'react';
import { useVolumeStore } from '@/features/player/stores/volumeStore';
import type { AudioPlayer } from '@/features/player/types';

/** A new player starts at full volume: the chosen one is applied to each. */
export function usePlayerVolume(player: AudioPlayer): void {
	const volume = useVolumeStore(state => state.volume);
	const muted = useVolumeStore(state => state.muted);

	useEffect(() => {
		player.volume = muted ? 0 : volume;
	}, [player, volume, muted]);
}
