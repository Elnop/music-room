import * as Device from 'expo-device';

export function getModelName(): string | null {
	return Device.modelName;
}

export function getDeviceName(): string | null {
	return Device.deviceName;
}
