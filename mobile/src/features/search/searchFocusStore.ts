import { createStore } from 'zustand/vanilla';

type SearchFocusState = {
	pending: boolean;
};

export const searchFocusStore = createStore<SearchFocusState>(() => ({
	pending: false,
}));

export const searchFocusActions = {
	request: () => searchFocusStore.setState({ pending: true }),
	consume: () => searchFocusStore.setState({ pending: false }),
};
