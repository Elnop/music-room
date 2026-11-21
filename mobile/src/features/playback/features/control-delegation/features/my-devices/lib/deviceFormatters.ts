import { DEVICE_NAME_MAX_LENGTH } from '@/features/playback/features/control-delegation/features/my-devices/myDevicesConfig';

function sameName(model: string, deviceName: string): boolean {
	return model.trim().toLowerCase() === deviceName.trim().toLowerCase();
}

function formatLastSeen(lastSeenAt: string): string {
	const date = new Date(lastSeenAt);
	if (Number.isNaN(date.getTime())) return '';
	return `Vu le ${date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`;
}

export function deviceMeta(device: {
	model: string;
	deviceName: string;
	lastSeenAt: string;
}): string {
	return [
		sameName(device.model, device.deviceName) ? null : device.model,
		formatLastSeen(device.lastSeenAt),
	]
		.filter(Boolean)
		.join(' · ');
}

export function deviceNameError(trimmed: string): string | undefined {
	if (trimmed.length === 0) return 'Saisissez un nom';
	if (trimmed.length > DEVICE_NAME_MAX_LENGTH) {
		return `${DEVICE_NAME_MAX_LENGTH} caractères au maximum`;
	}
	return undefined;
}
