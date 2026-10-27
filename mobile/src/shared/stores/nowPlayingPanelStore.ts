import { create } from 'zustand';
import { onSessionEnd } from '@/shared/services/authSession';

interface NowPlayingPanelState {
	/** The desktop's panel beside the content; the phone and the tablet never read it. */
	isOpen: boolean;
	setOpen: (isOpen: boolean) => void;
	toggle: () => void;
}

/** In `shared/`: the screens' content width (ContentContainer) gives the panel its share of the window. */
export const useNowPlayingPanelStore = create<NowPlayingPanelState>(set => ({
	isOpen: false,
	setOpen: isOpen => set({ isOpen }),
	toggle: () => set(state => ({ isOpen: !state.isOpen })),
}));

onSessionEnd(() => useNowPlayingPanelStore.setState({ isOpen: false }));
