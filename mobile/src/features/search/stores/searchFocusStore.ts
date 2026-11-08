import { create } from 'zustand';

interface SearchFocusState {
	pending: boolean;
	request: () => void;
	consume: () => void;
}

export const useSearchFocusStore = create<SearchFocusState>(set => ({
	pending: false,
	request: () => set({ pending: true }),
	consume: () => set({ pending: false }),
}));
