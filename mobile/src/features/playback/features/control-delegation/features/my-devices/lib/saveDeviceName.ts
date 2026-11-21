import { musicControlApi } from '@/features/playback/features/control-delegation/shared/delegation/musicControlApi';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';

export async function saveDeviceName(deviceId: string, name: string | null): Promise<boolean> {
	try {
		await musicControlApi.renameDevice(deviceId, name);
		showSuccess('Appareil renommé');
		return true;
	} catch (error) {
		showError(apiErrorMessage(error, "Impossible de renommer l'appareil"));
		return false;
	}
}
