import {
	startEventBeacon,
	stopEventBeacon,
} from '@/features/events/features/detail/lib/beaconAdvertiser.android';

const mockNative = { getState: jest.fn(), start: jest.fn(), stop: jest.fn() };
const mockRequest = jest.fn();

jest.mock('expo', () => ({ requireOptionalNativeModule: () => mockNative }));
jest.mock('react-native', () => ({
	Platform: { Version: 34 },
	PermissionsAndroid: {
		PERMISSIONS: { BLUETOOTH_ADVERTISE: 'advertise' },
		RESULTS: { GRANTED: 'granted', DENIED: 'denied' },
		request: (...args: unknown[]) => mockRequest(...args),
	},
}));

beforeEach(() => {
	jest.clearAllMocks();
	mockRequest.mockResolvedValue('granted');
	mockNative.getState.mockReturnValue('on');
	mockNative.start.mockResolvedValue(undefined);
});

describe('startEventBeacon', () => {
	it('asks for "Nearby devices", then advertises the iBeacon frame under Apple’s company ID', async () => {
		await startEventBeacon(42);
		expect(mockRequest).toHaveBeenCalledWith('advertise', expect.anything());
		const [companyId, data] = mockNative.start.mock.calls[0];
		expect(companyId).toBe(0x004c);
		expect(data).toHaveLength(23);
		expect(data.slice(20, 22)).toStrictEqual([0, 42]);
	});

	it.each([
		['permission-denied', () => mockRequest.mockResolvedValue('denied')],
		['bluetooth-off', () => mockNative.getState.mockReturnValue('off')],
		['unsupported', () => mockNative.getState.mockReturnValue('unsupported')],
		['failed', () => mockNative.start.mockRejectedValue({ code: 'ADVERTISE_FAILED_2' })],
	])('fails with %s', async (reason, setUp) => {
		setUp();
		await expect(startEventBeacon(42)).rejects.toMatchObject({ reason });
	});
});

describe('stopEventBeacon', () => {
	it('stops the native advertising', () => {
		stopEventBeacon();
		expect(mockNative.stop).toHaveBeenCalledWith();
	});
});
