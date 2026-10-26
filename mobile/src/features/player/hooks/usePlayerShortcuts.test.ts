import { renderHook } from '@testing-library/react-native';
import { usePlayerShortcuts } from './usePlayerShortcuts';

const mockControls = {
	sliderDisabled: false,
	playDisabled: false,
	handlePlayPause: jest.fn(),
	handleSliderAction: jest.fn(),
	handlePrevious: jest.fn(),
	handleNext: jest.fn(),
};

jest.mock('@/features/player/hooks/usePlaybackControls', () => ({
	usePlaybackControls: () => mockControls,
}));

const run = (key: string, shift?: boolean) => {
	const { result } = renderHook(() => usePlayerShortcuts());
	const shortcut = result.current.find(item => item.key === key && item.shift === shift);
	shortcut?.run();
};

describe('usePlayerShortcuts', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockControls.sliderDisabled = false;
		mockControls.playDisabled = false;
	});

	it('maps the arrows to a step and Shift and the arrows to the next or previous track', () => {
		run('ArrowLeft', false);
		run('ArrowRight', false);
		run('ArrowLeft', true);
		run('ArrowRight', true);

		expect(mockControls.handleSliderAction.mock.calls).toEqual([['decrement'], ['increment']]);
		expect(mockControls.handlePrevious).toHaveBeenCalledTimes(1);
		expect(mockControls.handleNext).toHaveBeenCalledTimes(1);
	});

	it('never seeks while the slider is disabled, as for a remote device', () => {
		mockControls.sliderDisabled = true;
		run('ArrowRight', false);
		expect(mockControls.handleSliderAction).not.toHaveBeenCalled();
	});

	it('toggles playback with Space only when the play button could', () => {
		run(' ');
		mockControls.playDisabled = true;
		run(' ');
		expect(mockControls.handlePlayPause).toHaveBeenCalledTimes(1);
	});
});
