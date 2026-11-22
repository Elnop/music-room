import { createStore } from 'zustand';

type VolumeState = {
	volume: number;
	muted: boolean;
	setVolume: (volume: number) => void;
	toggleMute: () => void;
};

export const volumeStore = createStore<VolumeState>((set) => ({
	volume: 1,
	muted: false,
	setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)), muted: volume <= 0 }),
	toggleMute: () =>
		set((state) =>
			state.muted && state.volume <= 0 ? { volume: 1, muted: false } : { muted: !state.muted },
		),
}));
