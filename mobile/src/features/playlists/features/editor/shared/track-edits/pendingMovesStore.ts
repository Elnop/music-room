import { createStore } from 'zustand/vanilla';

type PendingMovesState = {
	count: number;
};

export const pendingMovesStore = createStore<PendingMovesState>(() => ({
	count: 0,
}));

export const pendingMovesActions = {
	change: (delta: 1 | -1) => pendingMovesStore.setState(state => ({ count: state.count + delta })),
};
