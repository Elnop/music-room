import { create } from 'zustand';
import { onSessionEnd } from '@/shared/services/authSession';

interface NowPlayingPanelState {
	isOpen: boolean;
	setOpen: (isOpen: boolean) => void;
	toggle: () => void;
}

export const useNowPlayingPanelStore = create<NowPlayingPanelState>(set => ({
	isOpen: false,
	setOpen: isOpen => set({ isOpen }),
	toggle: () => set(state => ({ isOpen: !state.isOpen })),
}));

onSessionEnd(() => useNowPlayingPanelStore.setState({ isOpen: false }));
