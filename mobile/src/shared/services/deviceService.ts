import Constants from 'expo-constants';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { deviceStorage } from './deviceStorage';
import { getDeviceName, getModelName } from './deviceIdentity';

/** Single source for the `X-App-Version` header and the Socket.io handshake. */
export function getAppVersion(): string {
	return (
		Constants?.expoConfig?.version ||
		Constants?.manifest?.version ||
		Constants?.manifest2?.extra?.expoClient?.version ||
		'1.0.0'
	);
}

// e.g. `Zumik 1.0.0 (build 42 · a1b2c3d)`: release-apk.yml sets the build number and
// commit SHA before bundling; a local build has neither and reads `dev`.
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

export interface DeviceInfo {
	deviceId: string;
	deviceName: string;
	platform: string;
	model: string;
}

/** The deviceId persists in deviceStorage so it stays the same across app restarts. */
export const deviceService = {
	async getDeviceInfo(): Promise<DeviceInfo> {
		let deviceId = await deviceStorage.getDeviceId();
		if (!deviceId) {
			deviceId = uuidv4();
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
