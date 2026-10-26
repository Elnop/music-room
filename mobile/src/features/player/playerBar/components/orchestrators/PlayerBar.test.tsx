import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { PlayerBar } from './PlayerBar';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { useVolumeStore } from '@/features/player/stores/volumeStore';
import { registerPlayerModals } from '@/shared/services/playerModalsBridge';
import type { NowPlaying } from '@/features/player/types';

const mockSeekTo = jest.fn();
const mockPrevious = jest.fn();
const mockNext = jest.fn();
const mockToggle = jest.fn();

let mockNowPlaying: NowPlaying;

jest.mock('@/shared/utils/haptics', () => ({
	hapticTap: jest.fn(),
	hapticSelection: jest.fn(),
	hapticSuccess: jest.fn(),
}));

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/features/player/context/PlayerContext', () => ({
	usePlayer: () => ({ player: { volume: 1 }, seekTo: mockSeekTo, loading: false, error: null }),
}));

jest.mock('@/features/player/hooks/useNowPlaying', () => ({
	useNowPlaying: () => mockNowPlaying,
}));

jest.mock('@react-native-community/slider', () => {
	const { View } = jest.requireActual('react-native');
	return {
		__esModule: true,
		default: (props: Record<string, unknown>) => <View testID="slider" {...props} />,
	};
});

const playing = (overrides: Partial<NowPlaying> = {}): NowPlaying => ({
	isRemote: false,
	track: { id: 1, title: 'Goofy Goober Rock', artist: 'Matthew', artworkUrl: null },
	isPlaying: true,
	isLoading: false,
	canToggle: true,
	positionMs: 30_000,
	durationMs: 200_000,
	deviceLabel: null,
	toggle: mockToggle,
	next: mockNext,
	previous: mockPrevious,
	hasNext: true,
	hasPrevious: true,
	...overrides,
});

const seekSlider = () => screen.getAllByTestId('slider', { includeHiddenElements: true })[0];
const volumeSlider = () => screen.getByLabelText('Volume');

describe('PlayerBar', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockNowPlaying = playing();
		usePlayerStore.setState({ isModalOpen: false });
		useVolumeStore.setState({ volume: 1, muted: false });
		registerPlayerModals({
			QueueModal: ({ visible }) => (visible ? <Text>queue-sheet</Text> : null),
			DevicePickerSheet: ({ visible }) => (visible ? <Text>devices-sheet</Text> : null),
		});
	});

	it('shows the track with the elapsed time and the length', () => {
		render(<PlayerBar />);
		expect(screen.getByText('Goofy Goober Rock')).toBeTruthy();
		expect(screen.getByText('0:30')).toBeTruthy();
		expect(screen.getByText('3:20')).toBeTruthy();
	});

	it('goes back, toggles and skips', () => {
		render(<PlayerBar />);
		fireEvent.press(screen.getByLabelText('Piste précédente'));
		fireEvent.press(screen.getByLabelText('Pause'));
		fireEvent.press(screen.getByLabelText('Piste suivante'));
		expect(mockPrevious).toHaveBeenCalled();
		expect(mockToggle).toHaveBeenCalled();
		expect(mockNext).toHaveBeenCalled();
	});

	it('seeks where the progress bar is clicked', () => {
		render(<PlayerBar />);
		act(() => seekSlider().props.onSlidingComplete(120));
		expect(mockSeekTo).toHaveBeenCalledWith(120);
	});

	it('never seeks nor sets the volume of a remote device', () => {
		mockNowPlaying = playing({ isRemote: true, deviceLabel: 'Pixel' });
		render(<PlayerBar />);
		expect(seekSlider().props.disabled).toBe(true);
		expect(volumeSlider().props.disabled).toBe(true);
		expect(screen.getByText('Sur Pixel')).toBeTruthy();
		act(() => seekSlider().props.onSlidingComplete(120));
		expect(mockSeekTo).not.toHaveBeenCalled();
	});

	it('sets, mutes and restores the volume', () => {
		render(<PlayerBar />);
		act(() => volumeSlider().props.onValueChange(0.4));
		expect(useVolumeStore.getState().volume).toBe(0.4);

		fireEvent.press(screen.getByLabelText('Couper le son'));
		expect(volumeSlider().props.value).toBe(0);
		fireEvent.press(screen.getByLabelText('Activer le son'));
		expect(volumeSlider().props.value).toBe(0.4);
	});

	it('opens the queue, the device picker and the full player', () => {
		render(<PlayerBar />);
		fireEvent.press(screen.getByLabelText("File d'attente"));
		expect(screen.getByText('queue-sheet')).toBeTruthy();
		fireEvent.press(screen.getByLabelText("Choisir l'appareil"));
		expect(screen.getByText('devices-sheet')).toBeTruthy();
		fireEvent.press(screen.getByLabelText(/^Ouvrir le lecteur/));
		expect(usePlayerStore.getState().isModalOpen).toBe(true);
	});

	it('offers nothing to play without a track', () => {
		mockNowPlaying = playing({ track: null, isPlaying: false, durationMs: null, hasNext: false });
		render(<PlayerBar />);
		expect(screen.getByText('Rien en lecture')).toBeTruthy();
		expect(screen.getByLabelText('Lecture')).toBeDisabled();
		expect(screen.getByLabelText('Piste suivante')).toBeDisabled();
	});
});
