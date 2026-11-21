import { createStore } from 'zustand';
import { onSessionEnd } from '@/shared/backend/lib/sessionEnd';

type NowPlayingPanelState = {
	isOpen: boolean;
	setOpen: (isOpen: boolean) => void;
	toggle: () => void;
};

export const nowPlayingPanelStore = createStore<NowPlayingPanelState>(set => ({
	isOpen: false,
	setOpen: isOpen => set({ isOpen }),
	toggle: () => set(state => ({ isOpen: !state.isOpen })),
}));

onSessionEnd(() => nowPlayingPanelStore.setState({ isOpen: false }));
