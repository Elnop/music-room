import { create } from 'zustand';

interface PendingMovesState {
	/** Moves sent or queued and not answered yet: the drag stays off meanwhile. */
	count: number;
	change: (delta: 1 | -1) => void;
}

export const usePendingMovesStore = create<PendingMovesState>(set => ({
	count: 0,
	change: delta => set(state => ({ count: state.count + delta })),
}));
