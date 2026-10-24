import { createContext, useContext } from 'react';
import type { PlayerContextValue } from '@/features/player/types';
import { MINI_PLAYER_HEIGHT } from '@/features/player/constants';
import { useMiniPlayerLayoutStore } from '@/features/player/stores/miniPlayerLayoutStore';

export { MINI_PLAYER_HEIGHT } from '@/features/player/constants';
export const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
	const context = useContext(PlayerContext);
	if (!context) {
		throw new Error('usePlayer must be used within PlayerProvider');
	}
	return context;
}

/** The mini-player is always shown: its measured height, or the estimate before its first layout. */
export function usePlayerHeight(): number {
	return useMiniPlayerLayoutStore(state => state.height) ?? MINI_PLAYER_HEIGHT;
}
