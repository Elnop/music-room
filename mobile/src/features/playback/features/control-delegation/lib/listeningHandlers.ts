import { logger } from '@/shared/logging/logger';
import type { UserListeningStatus } from '@/features/playback/shared/player/types/listeningTypes';
import type { SetListening } from '@/features/playback/features/control-delegation/controlDelegationTypes';

export function listeningHandlers(targetUserId: string, setListening: SetListening) {
	return {
		handleStatus: (status: UserListeningStatus) => {
			if (status.ownerId !== targetUserId) return;
			setListening((current) => ({ ...current, statuses: status.devices, isLoading: false }));
		},
		handleError: (err: { message: string; code: string }) => {
			logger.error('[MusicControl] Error:', err);
			setListening((current) => ({ ...current, error: err.message, isLoading: false }));
		},
	};
}
