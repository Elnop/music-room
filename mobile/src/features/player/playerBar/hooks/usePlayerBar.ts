import { useState } from 'react';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { useVolumeStore } from '@/features/player/stores/volumeStore';
import { usePlaybackControls } from '@/features/player/hooks/usePlaybackControls';
import { useSeekPosition } from '@/features/player/modal/hooks/useSeekPosition';
import { openPlayerLabel } from '@/features/player/utils/openPlayerLabel';

export function usePlayerBar() {
	const setModalOpen = usePlayerStore(state => state.setModalOpen);
	const volume = useVolumeStore(state => state.volume);
	const muted = useVolumeStore(state => state.muted);
	const setVolume = useVolumeStore(state => state.setVolume);
	const toggleMute = useVolumeStore(state => state.toggleMute);
	const { nowPlaying, ...controls } = usePlaybackControls();
	const seek = useSeekPosition(controls.currentTime, controls.handleSeek);
	const [isQueueOpen, setQueueOpen] = useState(false);
	const [isDevicesOpen, setDevicesOpen] = useState(false);

	const { track, deviceLabel } = nowPlaying;
	const openLabel = openPlayerLabel(track, deviceLabel);

	return {
		...controls,
		track,
		deviceLabel,
		isRemote: nowPlaying.isRemote,
		isPlaying: nowPlaying.isPlaying,
		isLoading: nowPlaying.isLoading,
		openLabel,
		seek,
		/** The volume is the local player's: a remote device keeps its own. */
		volume: muted ? 0 : volume,
		volumeDisabled: nowPlaying.isRemote,
		onVolumeChange: setVolume,
		onToggleMute: toggleMute,
		onOpenPlayer: () => setModalOpen(true),
		isQueueOpen,
		isDevicesOpen,
		onOpenQueue: () => setQueueOpen(true),
		onCloseQueue: () => setQueueOpen(false),
		onOpenDevices: () => setDevicesOpen(true),
		onCloseDevices: () => setDevicesOpen(false),
	};
}

export type PlayerBarData = ReturnType<typeof usePlayerBar>;
