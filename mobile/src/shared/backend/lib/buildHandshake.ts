import { deviceService, getAppVersion } from '@/shared/backend/deviceService';
import { getSession } from '@/shared/backend/lib/authSession';
import { reportBackendError } from '@/shared/backend/lib/backendErrors';

export async function buildHandshake(): Promise<Record<string, string>> {
	const token = getSession().accessToken ?? '';
	const appVersion = getAppVersion();
	try {
		const device = await deviceService.getDeviceInfo();
		return { token, ...device, appVersion };
	} catch (error) {
		reportBackendError('error', '[Socket] Could not read device info for the handshake:', error);
		return { token, deviceId: '', deviceName: '', platform: '', model: '', appVersion };
	}
}
