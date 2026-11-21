import { useStore } from 'zustand';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import type { PlayerState } from '@/features/playback/shared/player/types/playerStateTypes';

export function usePlayerState<T>(selector: (state: PlayerState) => T): T {
	return useStore(playerStore, selector);
}
