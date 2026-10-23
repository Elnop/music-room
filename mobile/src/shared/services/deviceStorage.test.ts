import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceStorage } from './deviceStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('deviceStorage', () => {
	beforeEach(async () => {
		await AsyncStorage.clear();
	});

	it('returns null when no device ID is stored', async () => {
		const id = await deviceStorage.getDeviceId();
		expect(id).toBeNull();
	});

	it('stores and retrieves device ID', async () => {
		await deviceStorage.setDeviceId('test-device-id');
		const id = await deviceStorage.getDeviceId();
		expect(id).toBe('test-device-id');
	});

	it('clears device ID', async () => {
		await deviceStorage.setDeviceId('test-device-id');
		await deviceStorage.clearDeviceId();
		const id = await deviceStorage.getDeviceId();
		expect(id).toBeNull();
	});
});
