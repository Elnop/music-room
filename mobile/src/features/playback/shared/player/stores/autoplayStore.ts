import { create } from 'zustand';

interface AutoplayState {
	blocked: boolean;
	setBlocked: (blocked: boolean) => void;
}

export const useAutoplayStore = create<AutoplayState>(set => ({
	blocked: false,
	setBlocked: blocked => set({ blocked }),
}));
