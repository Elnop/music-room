import { registerMusicControlBridge } from '@/shared/services/musicControlBridge';
import { useFriendListening } from '@/features/music-control/hooks/useFriendListening';
import { musicControlApi } from '@/features/music-control/services/musicControlApi';

export function registerMusicControl(): void {
	registerMusicControlBridge({
		useFriendListening,
		getDevicePicker: () => musicControlApi.getDevicePicker(),
	});
}
