import { useEffect } from 'react';
import { useVolumeStore } from '@/features/playback/shared/volume/volumeStore';
import type { AudioPlayer } from '@/features/playback/shared/player/lib/types';

export function usePlayerVolume(player: AudioPlayer): void {
	const volume = useVolumeStore(state => state.volume);
	const muted = useVolumeStore(state => state.muted);

	useEffect(() => {
		player.volume = muted ? 0 : volume;
	}, [player, volume, muted]);
}
