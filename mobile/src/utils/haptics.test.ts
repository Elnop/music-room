import * as Haptics from 'expo-haptics';
import { hapticSelection, hapticSuccess, hapticTap } from '@utils/haptics';

jest.mock('expo-haptics', () => ({
	impactAsync: jest.fn(() => Promise.resolve()),
	selectionAsync: jest.fn(() => Promise.resolve()),
	notificationAsync: jest.fn(() => Promise.resolve()),
	ImpactFeedbackStyle: { Light: 'light' },
	NotificationFeedbackType: { Success: 'success' },
}));

const flush = () => new Promise<void>(resolve => setImmediate(() => resolve()));

describe('haptics', () => {
	beforeEach(() => jest.clearAllMocks());

	it('taps with a light impact', () => {
		hapticTap();
		expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
		expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
	});

	it('ticks a selection', () => {
		hapticSelection();
		expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
	});

	it('notifies a success', () => {
		hapticSuccess();
		expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
		expect(Haptics.notificationAsync).toHaveBeenCalledWith(
			Haptics.NotificationFeedbackType.Success
		);
	});

	it('swallows a rejection from a device without a vibrator', async () => {
		const error = jest.spyOn(console, 'error').mockImplementation(() => {});
		(Haptics.impactAsync as jest.Mock).mockReturnValueOnce(
			Promise.reject(new Error('no vibrator'))
		);
		(Haptics.selectionAsync as jest.Mock).mockReturnValueOnce(
			Promise.reject(new Error('no vibrator'))
		);
		(Haptics.notificationAsync as jest.Mock).mockReturnValueOnce(
			Promise.reject(new Error('no vibrator'))
		);
		expect(() => {
			hapticTap();
			hapticSelection();
			hapticSuccess();
		}).not.toThrow();
		await flush();
		expect(error).not.toHaveBeenCalled();
		error.mockRestore();
	});
});
