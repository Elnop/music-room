import { act, renderHook } from '@testing-library/react-native';
import { useSeekPosition } from './useSeekPosition';

describe('useSeekPosition', () => {
	const onSeek = jest.fn();
	const render = (currentTime = 30) =>
		renderHook(({ time }: { time: number }) => useSeekPosition(time, onSeek), {
			initialProps: { time: currentTime },
		});

	beforeEach(() => {
		jest.useFakeTimers();
		onSeek.mockClear();
	});

	afterEach(() => jest.useRealTimers());

	it('shows the player position when idle', () => {
		const { result, rerender } = render();
		rerender({ time: 31 });
		expect(result.current.position).toBe(31);
	});

	it('ignores value changes that are not a drag', () => {
		const { result } = render();
		act(() => result.current.onValueChange(90));
		expect(result.current.position).toBe(30);
	});

	it('holds the target after release until the player reaches it', () => {
		const { result, rerender } = render();
		act(() => result.current.onSlidingStart(30));
		act(() => result.current.onValueChange(100));
		act(() => result.current.onSlidingComplete(100));
		expect(onSeek).toHaveBeenCalledWith(100);

		rerender({ time: 30.5 });
		expect(result.current.position).toBe(100);

		rerender({ time: 100.2 });
		rerender({ time: 101 });
		expect(result.current.position).toBe(101);
	});

	it('lets go of a seek the player never reports', () => {
		const { result, rerender } = render();
		act(() => result.current.onSlidingStart(30));
		act(() => result.current.onSlidingComplete(100));
		rerender({ time: 31 });
		rerender({ time: 32 });
		act(() => jest.advanceTimersByTime(3000));
		expect(result.current.position).toBe(32);
	});
});
