import { create } from 'zustand';

interface MiniPlayerLayoutState {
	/** Measured on layout; `null` until the mini-player has rendered once. */
	height: number | null;
	setHeight: (height: number) => void;
}

export const useMiniPlayerLayoutStore = create<MiniPlayerLayoutState>(set => ({
	height: null,
	setHeight: height => set({ height }),
}));
