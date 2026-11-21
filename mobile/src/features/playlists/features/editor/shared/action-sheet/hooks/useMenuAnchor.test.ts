import { act, renderHook } from '@testing-library/react-native';
import { menuAnchorActions, menuAnchorStore } from '@/shared/theme/menuAnchorStore';
import { useMenuAnchor } from '@/features/playlists/features/editor/shared/action-sheet/hooks/useMenuAnchor';

const anchor = { x: 10, y: 20, width: 30, height: 40 };

afterEach(() => menuAnchorStore.setState({ anchor: null }));

describe('useMenuAnchor', () => {
	it('takes the recorded anchor as the menu opens and keeps it until it closes', () => {
		const { result, rerender } = renderHook(
			({ visible }: { visible: boolean }) => useMenuAnchor(visible),
			{
				initialProps: { visible: false },
			}
		);
		act(() => menuAnchorActions.set(anchor));
		rerender({ visible: true });

		expect(result.current).toStrictEqual(anchor);
		expect(menuAnchorStore.getState().anchor).toBeNull();
		rerender({ visible: false });
		expect(result.current).toStrictEqual(anchor);
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
		menuAnchorActions.set(anchor);
		const { result } = renderHook(() => useMenuAnchor(true));
		expect(result.current).toStrictEqual(anchor);
		expect(menuAnchorStore.getState().anchor).toBeNull();
	});
});
