import { createContext, useContext } from 'react';
import type { PlayerContextValue } from '@/features/playback/shared/player/lib/types';
export const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
	const context = useContext(PlayerContext);
	if (!context) {
		throw new Error('usePlayer must be used within PlayerProvider');
	}
	return context;
}
