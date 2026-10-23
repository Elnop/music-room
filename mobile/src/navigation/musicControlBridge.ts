import { registerMusicControlBridge } from '@/shared/services/musicControlBridge';
import { useFriendListening } from '@/features/music-control/hooks/useFriendListening';
import { musicControlApi } from '@/features/music-control/services/musicControlApi';

/**
 * Plugs the music-control feature into the shared musicControlBridge contract, so
 * other features (like friends and queue) can access it without importing music-control.
 */
export function registerMusicControl(): void {
	registerMusicControlBridge({
		useFriendListening,
		getDevicePicker: () => musicControlApi.getDevicePicker(),
	});
}
