import { create } from 'zustand';
import { onSessionEnd } from '@/shared/backend/lib/authSession';

interface NowPlayingPanelState {
	isOpen: boolean;
	setOpen: (isOpen: boolean) => void;
	toggle: () => void;
}

/** In `shared/`: ContentFrame reads it to give the panel its share of the window. */
export const useNowPlayingPanelStore = create<NowPlayingPanelState>(set => ({
	isOpen: false,
	setOpen: isOpen => set({ isOpen }),
	toggle: () => set(state => ({ isOpen: !state.isOpen })),
}));

onSessionEnd(() => useNowPlayingPanelStore.setState({ isOpen: false }));
