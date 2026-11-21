import type { usePlaybackControls } from '@/features/playback/shared/player/hooks/usePlaybackControls';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';
import type { SeekPosition } from '@/features/playback/shared/seek-bar/seekBarTypes';

export type PlayerBarTransport = Omit<ReturnType<typeof usePlaybackControls>, 'nowPlaying'>;

export type PlayerBarPlayback = {
	nowPlaying: NowPlaying;
	transport: PlayerBarTransport;
	seek: SeekPosition;
};

export type PlayerBarPanel = {
	isOpen: boolean;
	label: string;
	trackLabel: string;
	onToggle: () => void;
};

export type PlayerBarVolume = {
	value: number;
	disabled: boolean;
	onChange: (volume: number) => void;
	onToggleMute: () => void;
};

export type PlayerBarSheets = {
	isQueueOpen: boolean;
	isDevicesOpen: boolean;
	onOpenQueue: () => void;
	onCloseQueue: () => void;
	onOpenDevices: () => void;
	onCloseDevices: () => void;
};

export type PlayerBarData = PlayerBarPlayback & {
	panel: PlayerBarPanel;
	volume: PlayerBarVolume;
	sheets: PlayerBarSheets;
};
