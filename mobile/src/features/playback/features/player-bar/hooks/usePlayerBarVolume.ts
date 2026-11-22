import { useVolumeState } from '@/features/playback/shared/volume/useVolumeState';
import type { PlayerBarVolume } from '@/features/playback/features/player-bar/playerBarTypes';

export function usePlayerBarVolume(isRemote: boolean): PlayerBarVolume {
	const volume = useVolumeState((state) => state.volume);
	const muted = useVolumeState((state) => state.muted);
	const onChange = useVolumeState((state) => state.setVolume);
	const onToggleMute = useVolumeState((state) => state.toggleMute);
	return { value: muted ? 0 : volume, disabled: isRemote, onChange, onToggleMute };
}
