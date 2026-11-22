import { createStore } from 'zustand';
import type { AutoplayState } from '@/features/playback/shared/player/types/playerTypes';

export const autoplayStore = createStore<AutoplayState>((set) => ({
	blocked: false,
	setBlocked: (blocked) => set({ blocked }),
}));
