import { useState } from 'react';
import { useNowPlayingPanelStore } from '@/features/playback/shared/panel/nowPlayingPanelStore';
import { useVolumeStore } from '@/features/playback/shared/volume/volumeStore';
import { usePlaybackControls } from '@/features/playback/shared/player/hooks/usePlaybackControls';
import { useSeekPosition } from '@/features/playback/shared/seek-bar/useSeekPosition';
import { trackSummary } from '@/features/playback/shared/player/lib/openPlayerLabel';

export function usePlayerBar() {
	const isPanelOpen = useNowPlayingPanelStore(state => state.isOpen);
	const togglePanel = useNowPlayingPanelStore(state => state.toggle);
	const volume = useVolumeStore(state => state.volume);
	const muted = useVolumeStore(state => state.muted);
	const setVolume = useVolumeStore(state => state.setVolume);
	const toggleMute = useVolumeStore(state => state.toggleMute);
	const { nowPlaying, ...controls } = usePlaybackControls();
	const seek = useSeekPosition(controls.currentTime, controls.handleSeek);
	const [isQueueOpen, setQueueOpen] = useState(false);
	const [isDevicesOpen, setDevicesOpen] = useState(false);

	const { track, deviceLabel } = nowPlaying;
	const panelLabel = isPanelOpen
		? 'Masquer « En cours de lecture »'
		: 'Afficher « En cours de lecture »';

	return {
		...controls,
		track,
		deviceLabel,
		isRemote: nowPlaying.isRemote,
		isPlaying: nowPlaying.isPlaying,
		isLoading: nowPlaying.isLoading,
		trackLabel: [panelLabel, ...trackSummary(track, deviceLabel)].join(', '),
		panelLabel,
		isPanelOpen,
		onTogglePanel: togglePanel,
		seek,
		volume: muted ? 0 : volume,
		volumeDisabled: nowPlaying.isRemote,
		onVolumeChange: setVolume,
		onToggleMute: toggleMute,
		isQueueOpen,
		isDevicesOpen,
		onOpenQueue: () => setQueueOpen(true),
		onCloseQueue: () => setQueueOpen(false),
		onOpenDevices: () => setDevicesOpen(true),
		onCloseDevices: () => setDevicesOpen(false),
	};
}

export type PlayerBarData = ReturnType<typeof usePlayerBar>;
