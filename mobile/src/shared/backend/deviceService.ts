import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { deviceStorage } from '@/shared/backend/lib/deviceStorage';
import { getDeviceName, getModelName } from '@/shared/backend/lib/deviceIdentity';
import type { DeviceInfo } from '@/shared/backend/types/deviceTypes';

export function getAppVersion(): string {
	return (
		Constants?.expoConfig?.version ||
		Constants?.manifest?.version ||
		Constants?.manifest2?.extra?.expoClient?.version ||
		'1.0.0'
	);
}

export function formatBuildLabel(version: string, buildNumber?: string, commit?: string): string {
	if (!buildNumber) return `Zumik ${version} (dev)`;
	return commit
		? `Zumik ${version} (build ${buildNumber} · ${commit})`
		: `Zumik ${version} (build ${buildNumber})`;
}

export function getBuildLabel(): string {
	return formatBuildLabel(
		getAppVersion(),
		process.env.EXPO_PUBLIC_BUILD_NUMBER,
		process.env.EXPO_PUBLIC_COMMIT_SHA
	);
}

export const deviceService = {
	async getDeviceInfo(): Promise<DeviceInfo> {
		let deviceId = await deviceStorage.getDeviceId();
		if (!deviceId) {
			deviceId = randomUUID();
			await deviceStorage.setDeviceId(deviceId);
		}

		const deviceName =
			getDeviceName() || (Platform.OS === 'ios' ? 'Appareil iOS' : 'Appareil Android');
		const model = getModelName() || 'Modèle inconnu';

		return {
			deviceId,
			deviceName,
			platform: Platform.OS,
			model,
		};
	},

	async clearDeviceId(): Promise<void> {
		await deviceStorage.clearDeviceId();
	},
};
