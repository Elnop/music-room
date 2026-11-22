import { renderHook } from '@testing-library/react-native';
import { useWindowDimensions } from 'react-native';
import type { View } from 'react-native';
import { menuAnchorStore } from '@/shared/theme/menuAnchorStore';
import { useAnchoredPress } from '@/features/playlists/features/editor/features/detail/hooks/useAnchoredPress';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: jest.fn(),
}));

function mockWidth(width: number) {
	return jest
		.mocked(useWindowDimensions)
		.mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

function buttonAt(x: number, y: number) {
	return {
		current: {
			measureInWindow: (callback: (...rect: number[]) => void) => callback(x, y, 32, 32),
		} as unknown as View,
	};
}

afterEach(() => menuAnchorStore.setState({ anchor: null }));

describe('useAnchoredPress', () => {
	it('records where the button is before opening the menu on desktop', () => {
		mockWidth(1440);
		const onPress = jest.fn(() =>
			expect(menuAnchorStore.getState().anchor).toStrictEqual({
				x: 5,
				y: 6,
				width: 32,
				height: 32,
			}),
		);
		const { result } = renderHook(() => useAnchoredPress(buttonAt(5, 6), onPress));
		result.current();
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it('opens the sheet at once on the phone, without measuring', () => {
		mockWidth(390);
		const onPress = jest.fn();
		const { result } = renderHook(() => useAnchoredPress(buttonAt(5, 6), onPress));
		result.current();
		expect(onPress).toHaveBeenCalledTimes(1);
		expect(menuAnchorStore.getState().anchor).toBeNull();
	});
});
