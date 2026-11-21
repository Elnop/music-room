import {
	hasScanPermission,
	requestScanPermission,
} from '@/features/events/features/nearby/lib/scanPermission.android';

let mockVersion = 34;
const mockRequestMultiple = jest.fn();
const mockCheck = jest.fn();

jest.mock('react-native', () => ({
	Platform: {
		get Version() {
			return mockVersion;
		},
	},
	PermissionsAndroid: {
		PERMISSIONS: { BLUETOOTH_SCAN: 'scan', ACCESS_FINE_LOCATION: 'location' },
		RESULTS: { GRANTED: 'granted', DENIED: 'denied' },
		requestMultiple: (...args: unknown[]) => mockRequestMultiple(...args),
		check: (...args: unknown[]) => mockCheck(...args),
	},
}));

beforeEach(() => {
	jest.clearAllMocks();
	mockVersion = 34;
});

describe('scanPermission (Android)', () => {
	it('asks for "Nearby devices" and the location from Android 12', async () => {
		mockRequestMultiple.mockResolvedValue({ scan: 'granted', location: 'granted' });
		await expect(requestScanPermission()).resolves.toBe(true);
		expect(mockRequestMultiple).toHaveBeenCalledWith(['scan', 'location']);
	});

	it('asks for the location alone before Android 12', async () => {
		mockVersion = 30;
		mockRequestMultiple.mockResolvedValue({ location: 'granted' });
		await expect(requestScanPermission()).resolves.toBe(true);
		expect(mockRequestMultiple).toHaveBeenCalledWith(['location']);
	});

	it('refuses the scan when one permission is denied', async () => {
		mockRequestMultiple.mockResolvedValue({ scan: 'denied', location: 'granted' });
		await expect(requestScanPermission()).resolves.toBe(false);
	});

	it('needs every permission already granted to scan without asking', async () => {
		mockCheck.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
		await expect(hasScanPermission()).resolves.toBe(false);
		expect(mockCheck).toHaveBeenCalledWith('scan');
	});
});
