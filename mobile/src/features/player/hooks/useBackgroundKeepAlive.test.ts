import { act, renderHook } from '@testing-library/react-native';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { jsKeepAlive } from '@/features/player/services/jsKeepAlive';
import { useBackgroundKeepAlive } from './useBackgroundKeepAlive';

jest.mock('@/features/player/services/jsKeepAlive', () => ({
	jsKeepAlive: { start: jest.fn(), stop: jest.fn() },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('useBackgroundKeepAlive', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		usePlayerStore.setState({ playbackState: 'idle' });
	});

	it('keeps JS alive from loading through playing, then lets go on pause', () => {
		renderHook(() => useBackgroundKeepAlive());
		expect(jsKeepAlive.start).not.toHaveBeenCalled();

		act(() => usePlayerStore.setState({ playbackState: 'loading' }));
		act(() => usePlayerStore.setState({ playbackState: 'playing' }));
		expect(jsKeepAlive.start).toHaveBeenCalledTimes(1);
		expect(jsKeepAlive.stop).not.toHaveBeenCalled();

		act(() => usePlayerStore.setState({ playbackState: 'paused' }));
		expect(jsKeepAlive.stop).toHaveBeenCalledTimes(1);
	});

	it('lets go when the player unmounts while playing', () => {
		usePlayerStore.setState({ playbackState: 'playing' });
		const { unmount } = renderHook(() => useBackgroundKeepAlive());
		unmount();
		expect(jsKeepAlive.start).toHaveBeenCalledTimes(1);
		expect(jsKeepAlive.stop).toHaveBeenCalledTimes(1);
	});
});
