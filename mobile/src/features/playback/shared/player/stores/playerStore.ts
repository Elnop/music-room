import { createStore } from 'zustand';
import { onSessionEnd } from '@/shared/backend/lib/sessionEnd';
import { initialPlayerState } from '@/features/playback/shared/player/configs/playerStateConfig';
import { playerStreamActions } from '@/features/playback/shared/player/lib/playerStreamActions';
import { playerTrackActions } from '@/features/playback/shared/player/lib/playerTrackActions';
import { playerTransportActions } from '@/features/playback/shared/player/lib/playerTransportActions';
import type { PlayerState } from '@/features/playback/shared/player/types/playerStateTypes';

export const playerStore = createStore<PlayerState>((set, get) => ({
	...initialPlayerState,
	...playerStreamActions(set, get),
	...playerTrackActions(set, get),
	...playerTransportActions(set, get),
	toggleModal: () => set(state => ({ isModalOpen: !state.isModalOpen })),
	setModalOpen: isOpen => set({ isModalOpen: isOpen }),
	markSeek: () => set(state => ({ seekCount: state.seekCount + 1 })),
}));

onSessionEnd(() => {
	playerStore.getState().stop();
});
