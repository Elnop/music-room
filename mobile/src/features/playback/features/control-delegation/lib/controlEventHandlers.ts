import type { Dispatch, SetStateAction } from 'react';
import { logger } from '@/shared/logging/logger';
import type { ControlError } from '@/shared/control-error/controlErrorTypes';
import type { ControlEventHandlers } from '@/features/playback/features/control-delegation/controlDelegationTypes';

export function controlEventHandlers(
	targetUserId: string,
	reload: () => void,
	setControlError: Dispatch<SetStateAction<ControlError | null>>,
): ControlEventHandlers {
	return {
		handlePermissionChanged: (data) => {
			if (data.ownerId === targetUserId) reload();
		},
		handleControlError: (err) => {
			logger.error('[MusicControl] Control error:', err);
			setControlError({ code: err.code, message: err.message });
			if (err.code === 'NOT_AUTHORIZED') reload();
		},
	};
}
