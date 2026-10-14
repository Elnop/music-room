import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PlayerModal } from '@/components/player/PlayerModal';
import { usePlayerStore } from '@/store/playerStore';
import { useImageColors } from '@/hooks/useImageColors';

jest.mock('@/contexts/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@themes/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('react-native-gesture-handler', () => ({
	...jest.requireActual('react-native-gesture-handler'),
	GestureHandlerRootView: jest.requireActual('react-native').View,
}));

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@/services/queueApi', () => ({
	queueApi: {
		getQueue: jest.fn(),
		next: jest.fn(),
		previous: jest.fn(),
		playItem: jest.fn(),
		moveItem: jest.fn(),
		removeItem: jest.fn(),
	},
}));

jest.mock('@/contexts/PlayerContext', () => ({
	usePlayer: () => ({ player: { playing: false }, error: null }),
}));

jest.mock('@/hooks/usePlayerProgress', () => ({
	usePlayerProgress: () => ({ progress: 0, currentTime: 0, duration: 0 }),
}));

jest.mock('@/hooks/useImageColors', () => ({
	useImageColors: jest.fn(() => ({ dominantColor: null })),
	hexToRgba: (color: string) => color,
	getAdaptiveColors: (color: string) => color,
	isLightColor: () => false,
}));

jest.mock('expo-linear-gradient', () => ({
	LinearGradient: jest.requireActual('react-native').View,
}));

jest.mock('@react-native-community/slider', () => {
	const { View } = jest.requireActual('react-native');
	return {
		__esModule: true,
		default: (props: Record<string, unknown>) => <View testID="seek-slider" {...props} />,
	};
});

// The library needs native drag: render the header and empty state plainly.
jest.mock('react-native-reorderable-list', () => {
	const { View } = jest.requireActual('react-native');
	return {
		__esModule: true,
		default: (props: {
			ListHeaderComponent?: React.ReactElement;
			ListEmptyComponent?: React.ReactElement;
		}) => (
			<View>
				{props.ListHeaderComponent}
				{props.ListEmptyComponent}
			</View>
		),
		reorderItems: <T,>(data: T[]) => data,
		useReorderableDrag: () => jest.fn(),
		useIsActive: () => false,
	};
});

jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

describe('PlayerModal without a track', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		usePlayerStore.setState({ currentTrack: null, playbackState: 'idle', isModalOpen: true });
	});

	it('renders the empty state with disabled controls', () => {
		render(<PlayerModal />);
		expect(screen.getByText('Rien en lecture')).toBeTruthy();
		expect(screen.getByText('Choisis un son pour commencer')).toBeTruthy();
		expect(screen.getByTestId('seek-slider').props.disabled).toBe(true);
		for (const label of ['Previous track', 'Play', 'Next track']) {
			expect(screen.getByLabelText(label)).toBeDisabled();
		}
	});

	it('keeps the queue button working', () => {
		render(<PlayerModal />);
		fireEvent.press(screen.getByLabelText("File d'attente"));
		expect(screen.getByText("File d'attente")).toBeTruthy();
	});

	it('asks for no artwork colors and keeps the theme colors', () => {
		render(<PlayerModal />);
		expect(useImageColors).toHaveBeenCalledWith(null, expect.anything());
	});
});
