import { act, renderHook } from '@testing-library/react-native';
import { useMenuAnchorStore } from '@/shared/stores/menuAnchorStore';
import { useMenuAnchor } from './useMenuAnchor';

const anchor = { x: 10, y: 20, width: 30, height: 40 };

afterEach(() => useMenuAnchorStore.setState({ anchor: null }));

describe('useMenuAnchor', () => {
	it('takes the recorded anchor as the menu opens and keeps it until it closes', () => {
		const { result, rerender } = renderHook(
			({ visible }: { visible: boolean }) => useMenuAnchor(visible),
			{
				initialProps: { visible: false },
			}
		);
		act(() => useMenuAnchorStore.getState().setAnchor(anchor));
		rerender({ visible: true });

		expect(result.current).toEqual(anchor);
		expect(useMenuAnchorStore.getState().anchor).toBeNull();
		rerender({ visible: false });
		expect(result.current).toEqual(anchor);
	});

	it('has no anchor for a menu opened without its button (a long press)', () => {
		const { result, rerender } = renderHook(
			({ visible }: { visible: boolean }) => useMenuAnchor(visible),
			{
				initialProps: { visible: false },
			}
		);
		rerender({ visible: true });
		expect(result.current).toBeNull();
	});

	it('takes the anchor of a menu mounted already open', () => {
		useMenuAnchorStore.getState().setAnchor(anchor);
		const { result } = renderHook(() => useMenuAnchor(true));
		expect(result.current).toEqual(anchor);
		expect(useMenuAnchorStore.getState().anchor).toBeNull();
	});
});
