jest.mock('uuid', () => ({
	v4: () => 'generated-uuid-1234',
}));

jest.mock('expo-constants', () => {
	const data = {
		expoConfig: { version: '2.5.0' } as { version: string } | undefined,
		manifest: undefined as { version: string } | undefined,
		manifest2: undefined as { extra?: { expoClient?: { version: string } } } | undefined,
	};
	return {
		get expoConfig() {
			return data.expoConfig;
		},
		get manifest() {
			return data.manifest;
		},
		get manifest2() {
			return data.manifest2;
		},
		__data: data,
	};
});

let mockDeviceName: string | null = 'My Device';
let mockModelName: string | null = 'My Model';

jest.mock('expo-device', () => ({
	__esModule: true,
	get deviceName() {
		return mockDeviceName;
	},
	get modelName() {
		return mockModelName;
	},
}));

import Constants from 'expo-constants';
import { deviceService, getAppVersion } from './deviceService';
import { deviceStorage } from './deviceStorage';
import { Platform } from 'react-native';

const mockConstants = (
	Constants as unknown as {
		__data: {
			expoConfig?: { version: string };
			manifest?: { version: string };
			manifest2?: { extra?: { expoClient?: { version: string } } };
		};
	}
).__data;

jest.mock('./deviceStorage', () => ({
	deviceStorage: {
		getDeviceId: jest.fn(),
		setDeviceId: jest.fn(),
		clearDeviceId: jest.fn(),
	},
}));

describe('deviceService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockConstants.expoConfig = { version: '2.5.0' };
		mockConstants.manifest = undefined;
		mockConstants.manifest2 = undefined;
		mockDeviceName = 'My Device';
		mockModelName = 'My Model';
	});

	describe('getAppVersion', () => {
		it('returns expoConfig version if available', () => {
			expect(getAppVersion()).toBe('2.5.0');
		});

		it('falls back to manifest version if expoConfig is absent', () => {
			mockConstants.expoConfig = undefined;
			mockConstants.manifest = { version: '1.5.0' };
			expect(getAppVersion()).toBe('1.5.0');
		});

		it('falls back to 1.0.0 if not configured', () => {
			mockConstants.expoConfig = undefined;
			mockConstants.manifest = undefined;
			mockConstants.manifest2 = undefined;
			expect(getAppVersion()).toBe('1.0.0');
		});
	});

	describe('getDeviceInfo', () => {
		it('returns existing deviceId from storage', async () => {
			jest.mocked(deviceStorage.getDeviceId).mockResolvedValue('existing-id');

			const info = await deviceService.getDeviceInfo();

			expect(info).toEqual({
				deviceId: 'existing-id',
				deviceName: 'My Device',
				platform: Platform.OS,
				model: 'My Model',
			});
			expect(deviceStorage.setDeviceId).not.toHaveBeenCalled();
		});

		it('creates and persists new deviceId if not in storage', async () => {
			jest.mocked(deviceStorage.getDeviceId).mockResolvedValue(null);

			const info = await deviceService.getDeviceInfo();

			expect(info.deviceId).toBe('generated-uuid-1234');
			expect(deviceStorage.setDeviceId).toHaveBeenCalledWith('generated-uuid-1234');
			expect(info.deviceName).toBe('My Device');
		});

		it('uses fallback device name when Device.deviceName is null', async () => {
			jest.mocked(deviceStorage.getDeviceId).mockResolvedValue('id-1');
			mockDeviceName = null;
			mockModelName = null;

			const info = await deviceService.getDeviceInfo();

			expect(info.deviceName).toBe(Platform.OS === 'ios' ? 'Appareil iOS' : 'Appareil Android');
			expect(info.model).toBe('Modèle inconnu');
		});
	});

	describe('clearDeviceId', () => {
		it('delegates to deviceStorage.clearDeviceId', async () => {
			await deviceService.clearDeviceId();
			expect(deviceStorage.clearDeviceId).toHaveBeenCalled();
		});
	});
});
