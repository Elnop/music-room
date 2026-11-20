import { create } from 'zustand';

interface AutoplayState {
	/** The browser refused to play before any interaction with the page; a click unlocks it. */
	blocked: boolean;
	setBlocked: (blocked: boolean) => void;
}

export const useAutoplayStore = create<AutoplayState>(set => ({
	blocked: false,
	setBlocked: blocked => set({ blocked }),
}));
