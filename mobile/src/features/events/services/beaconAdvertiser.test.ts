import { PermissionsAndroid, Platform } from 'react-native';
import { startEventBeacon } from './beaconAdvertiser';

const mockNative = { getState: jest.fn(), start: jest.fn(), stop: jest.fn() };
jest.mock('expo', () => ({ requireOptionalNativeModule: () => mockNative }));

Object.defineProperty(Platform, 'OS', { get: () => 'android', configurable: true });
Object.defineProperty(Platform, 'Version', { get: () => 34, configurable: true });

const request = jest.spyOn(PermissionsAndroid, 'request');

beforeEach(() => {
	jest.clearAllMocks();
	request.mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
	mockNative.getState.mockReturnValue('on');
	mockNative.start.mockResolvedValue(undefined);
});

describe('startEventBeacon', () => {
	it('asks for "Nearby devices", then advertises the iBeacon frame under Apple’s company ID', async () => {
		await startEventBeacon(42);
		expect(request).toHaveBeenCalledWith(
			PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
			expect.anything()
		);
		const [companyId, data] = mockNative.start.mock.calls[0];
		expect(companyId).toBe(0x004c);
		expect(data).toHaveLength(23);
		expect(data.slice(20, 22)).toEqual([0, 42]);
	});

	it.each([
		['permission-denied', () => request.mockResolvedValue(PermissionsAndroid.RESULTS.DENIED)],
		['bluetooth-off', () => mockNative.getState.mockReturnValue('off')],
		['unsupported', () => mockNative.getState.mockReturnValue('unsupported')],
		['failed', () => mockNative.start.mockRejectedValue({ code: 'ADVERTISE_FAILED_2' })],
	])('fails with %s', async (reason, setUp) => {
		setUp();
		await expect(startEventBeacon(42)).rejects.toMatchObject({ reason });
	});
});
