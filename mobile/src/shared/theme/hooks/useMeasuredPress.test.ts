import { renderHook } from '@testing-library/react-native';
import { useWindowDimensions, type View } from 'react-native';
import { useMeasuredPress } from './useMeasuredPress';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: jest.fn(),
}));

const mockWidth = (width: number) =>
	jest.mocked(useWindowDimensions).mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });

const buttonAt = (x: number, y: number) => ({
	current: {
		measureInWindow: (callback: (...rect: number[]) => void) => callback(x, y, 32, 32),
	} as unknown as View,
});

describe('useMeasuredPress', () => {
	it('passes where the button is on desktop', () => {
		mockWidth(1440);
		const onPress = jest.fn();
		const { result } = renderHook(() => useMeasuredPress(buttonAt(5, 6), onPress));
		result.current();
		expect(onPress).toHaveBeenCalledWith({ x: 5, y: 6, width: 32, height: 32 });
	});

	it('presses at once on the phone, without measuring', () => {
		mockWidth(390);
		const onPress = jest.fn();
		const { result } = renderHook(() => useMeasuredPress(buttonAt(5, 6), onPress));
		result.current();
		expect(onPress).toHaveBeenCalledWith();
	});
});
