import { useStore } from 'zustand';
import { autoplayStore } from '@/features/playback/autoplayStore';
import type { AutoplayState } from '@/features/playback/shared/player/types/playerTypes';

export function useAutoplayState<T>(selector: (state: AutoplayState) => T): T {
	return useStore(autoplayStore, selector);
}
