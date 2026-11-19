import { create } from 'zustand';

interface SearchFocusState {
	/** Set by the `/` shortcut; the search screen focuses its field, mounted yet or not, then clears it. */
	pending: boolean;
	request: () => void;
	consume: () => void;
}

export const useSearchFocusStore = create<SearchFocusState>(set => ({
	pending: false,
	request: () => set({ pending: true }),
	consume: () => set({ pending: false }),
}));
