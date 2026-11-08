import { create } from 'zustand';

interface PendingMovesState {
	count: number;
	change: (delta: 1 | -1) => void;
}

export const usePendingMovesStore = create<PendingMovesState>(set => ({
	count: 0,
	change: delta => set(state => ({ count: state.count + delta })),
}));
