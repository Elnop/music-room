import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = '@zumik_device_id';

/**
 * App version sent to the backend (HTTP `X-App-Version` header and the
 * Socket.io handshake). Single source for both.
 */
export function getAppVersion(): string {
	return (
		Constants.expoConfig?.version ||
		Constants.manifest?.version ||
		Constants.manifest2?.extra?.expoClient?.version ||
		'1.0.0'
	);
}

/**
 * Device information for multi-device music control
 */
export interface DeviceInfo {
	deviceId: string;
	deviceName: string;
	platform: string;
	model: string;
}

/**
 * Device Service
 * Provides unique device identification for multi-device support
 *
 * The deviceId is persisted in AsyncStorage to remain consistent
 * across app restarts. Each physical device gets a unique ID.
 */
export const deviceService = {
	/**
	 * Get device information including a persistent device ID
	 * Creates a new ID if one doesn't exist
	 */
	async getDeviceInfo(): Promise<DeviceInfo> {
		let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
		if (!deviceId) {
			deviceId = uuidv4();
			await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
		}

		const deviceName = Device.deviceName || `${Platform.OS} Device`;
		const model = Device.modelName || 'Unknown';

		return {
			deviceId,
			deviceName,
			platform: Platform.OS,
			model,
		};
	},

	/**
	 * Clear the device ID (useful for testing or resetting)
	 */
	async clearDeviceId(): Promise<void> {
		await AsyncStorage.removeItem(DEVICE_ID_KEY);
	},
};
