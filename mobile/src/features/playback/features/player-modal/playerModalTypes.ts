import type { SharedValue } from 'react-native-reanimated';
import type { PanGesture } from 'react-native-gesture-handler';
import type { SeekPosition } from '@/features/playback/shared/seek-bar/seekBarTypes';
import type { usePlayerModal } from '@/features/playback/features/player-modal/hooks/usePlayerModal';
import type { usePlayerModalGestures } from '@/features/playback/features/player-modal/hooks/usePlayerModalGestures';

export type CarouselSlot = {
	key: string;
	index: number;
	uri: string | null;
	title: string;
	artist: string;
};

export type CarouselMotion = {
	center: SharedValue<number>;
	drag: SharedValue<number>;
	step: number;
};

export type ArtworkCarousel = {
	slots: CarouselSlot[];
	center: SharedValue<number>;
	drag: SharedValue<number>;
	hasPrevious: boolean;
	hasNext: boolean;
	panGesture: PanGesture;
	artworkSize: number;
	artworkStep: number;
};

export type PlayerColors = {
	text: string;
	textSecondary: string;
	buttonBg: string;
	slider: string;
	sliderBg: string;
	playBtnBg: string;
	playBtnIcon: string;
	error: string;
	errorBg: string;
};

export type PlayerTransportState = {
	isPlaying: boolean;
	isLoading: boolean;
	canGoPrevious: boolean;
	canGoNext: boolean;
	playDisabled: boolean;
};

export type PlayerTransportActions = {
	onPrevious: () => void;
	onPlayPause: () => void;
	onNext: () => void;
};

export type PlayerSheetsState = {
	isQueueOpen: boolean;
	setQueueOpen: (open: boolean) => void;
	isDevicesOpen: boolean;
	setDevicesOpen: (open: boolean) => void;
};

export type ScreenInsets = {
	top: number;
	bottom: number;
};

export type PlayerModalState = ReturnType<typeof usePlayerModal>;

export type PlayerModalParts = {
	modal: PlayerModalState;
	gestures: ReturnType<typeof usePlayerModalGestures>;
	seek: SeekPosition;
	carousel: ArtworkCarousel;
};

export type PlayerHeaderState = {
	dialog: boolean;
	isLoading: boolean;
};
