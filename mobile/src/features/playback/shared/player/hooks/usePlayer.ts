import { useContext } from 'react';
import { PlayerContext } from '@/features/playback/shared/player/configs/playerContextConfig';
import type { PlayerContextValue } from '@/features/playback/shared/player/types/playerTypes';

export function usePlayer(): PlayerContextValue {
	const context = useContext(PlayerContext);
	if (!context) {
		throw new Error('usePlayer must be used within PlayerProvider');
	}
	return context;
}
