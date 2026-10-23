import {
	registerMusicControlBridge,
	resetMusicControlBridge,
	useFriendListening,
	getDevicePicker,
	type FriendListeningResult,
} from './musicControlBridge';

jest.mock('./api', () => ({
	apiRequest: jest.fn(),
}));

describe('musicControlBridge', () => {
	afterEach(() => {
		resetMusicControlBridge();
	});

	it('returns default empty result when unregistered', () => {
		const result = useFriendListening('user-1');
		expect(result).toEqual({
			devices: [],
			canControl: false,
			isLoading: false,
			error: null,
			controlError: null,
			remotePlay: expect.any(Function),
			remotePause: expect.any(Function),
		});
		expect(() => result.remotePlay('d1')).not.toThrow();
		expect(() => result.remotePause('d1')).not.toThrow();
	});

	it('delegates to registered bridge', () => {
		const customResult: FriendListeningResult = {
			devices: [],
			canControl: true,
			isLoading: false,
			error: null,
			controlError: null,
			remotePlay: jest.fn(),
			remotePause: jest.fn(),
		};
		const mockBridge = {
			useFriendListening: jest.fn().mockReturnValue(customResult),
		};

		registerMusicControlBridge(mockBridge);
		const result = useFriendListening('user-2');

		expect(mockBridge.useFriendListening).toHaveBeenCalledWith('user-2');
		expect(result).toBe(customResult);
	});

	it('getDevicePicker delegates to registered bridge or fallback apiRequest', async () => {
		const mockResponse = { owners: [] };
		const mockBridge = {
			useFriendListening: jest.fn(),
			getDevicePicker: jest.fn().mockResolvedValue(mockResponse),
		};

		registerMusicControlBridge(mockBridge);
		const res = await getDevicePicker();
		expect(mockBridge.getDevicePicker).toHaveBeenCalled();
		expect(res).toBe(mockResponse);
	});
});
