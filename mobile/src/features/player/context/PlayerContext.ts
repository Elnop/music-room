import { createContext, useContext } from 'react';
import type { PlayerContextValue } from '@/features/player/types';
import { MINI_PLAYER_HEIGHT } from '@/features/player/constants';

export { MINI_PLAYER_HEIGHT } from '@/features/player/constants';
export const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
	const context = useContext(PlayerContext);
	if (!context) {
		throw new Error('usePlayer must be used within PlayerProvider');
	}
	return context;
}

/**
 * Height of the MiniPlayer for bottom padding: always MINI_PLAYER_HEIGHT,
 * since the mini-player is always shown (#296).
 */
export function usePlayerHeight(): number {
	return MINI_PLAYER_HEIGHT;
}
