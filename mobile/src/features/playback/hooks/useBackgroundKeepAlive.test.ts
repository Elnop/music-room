import { act, renderHook } from '@testing-library/react-native';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import { jsKeepAlive } from '@/features/playback/lib/jsKeepAlive';
import { useBackgroundKeepAlive } from '@/features/playback/hooks/useBackgroundKeepAlive';

jest.mock('@/features/playback/lib/jsKeepAlive', () => ({
	jsKeepAlive: { start: jest.fn(), stop: jest.fn() },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('useBackgroundKeepAlive', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		playerStore.setState({ playbackState: 'idle' });
	});

	it('keeps JS alive from loading through playing, then lets go on pause', () => {
		renderHook(() => useBackgroundKeepAlive());
		expect(jsKeepAlive.start).not.toHaveBeenCalled();

		act(() => playerStore.setState({ playbackState: 'loading' }));
		act(() => playerStore.setState({ playbackState: 'playing' }));
		expect(jsKeepAlive.start).toHaveBeenCalledTimes(1);
		expect(jsKeepAlive.stop).not.toHaveBeenCalled();

		act(() => playerStore.setState({ playbackState: 'paused' }));
		expect(jsKeepAlive.stop).toHaveBeenCalledTimes(1);
	});

	it('lets go when the player unmounts while playing', () => {
		playerStore.setState({ playbackState: 'playing' });
		const { unmount } = renderHook(() => useBackgroundKeepAlive());
		unmount();
		expect(jsKeepAlive.start).toHaveBeenCalledTimes(1);
		expect(jsKeepAlive.stop).toHaveBeenCalledTimes(1);
	});
});
