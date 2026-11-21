import type { useAnimatedStyle } from 'react-native-reanimated';
import type { PanGesture } from 'react-native-gesture-handler';
import type {
	NowPlaying,
	NowPlayingTrack,
} from '@/features/playback/shared/player/types/playerTypes';

export type MiniPlayerData = {
	track: NowPlayingTrack | null;
	deviceLabel: string | null;
	isPlaying: boolean;
	isLoading: boolean;
	playDisabled: boolean;
	nextDisabled: boolean;
	progress: number;
	openLabel: string;
	onToggleModal: () => void;
	onTogglePlay: () => void;
	onNext: () => void;
	infoStyle: ReturnType<typeof useAnimatedStyle>;
	panGesture: PanGesture;
};

export type MiniPlayerControls = {
	nowPlaying: NowPlaying;
	canGoNext: boolean;
	canGoPrevious: boolean;
	onTogglePlay: () => void;
	onNext: () => void;
	onPrevious: () => void;
};

export type MiniPlayerSwipe = {
	canGoNext: boolean;
	canGoPrevious: boolean;
	onNext: () => void;
	onPrevious: () => void;
	onOpen: () => void;
};
