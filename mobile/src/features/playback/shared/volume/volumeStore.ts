import { create } from 'zustand';

interface VolumeState {
	/** From 0 to 1; kept while muted, so unmuting restores it. */
	volume: number;
	muted: boolean;
	setVolume: (volume: number) => void;
	toggleMute: () => void;
}

export const useVolumeStore = create<VolumeState>(set => ({
	volume: 1,
	muted: false,
	setVolume: volume => set({ volume: Math.min(1, Math.max(0, volume)), muted: volume <= 0 }),
	toggleMute: () =>
		set(state =>
			state.muted && state.volume <= 0 ? { volume: 1, muted: false } : { muted: !state.muted }
		),
}));
