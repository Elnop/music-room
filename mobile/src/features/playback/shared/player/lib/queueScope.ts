import { ApiError } from '@/shared/backend/lib/ApiError';
import { getSession } from '@/shared/backend/lib/authSession';
import { connectStore } from '@/features/playback/shared/player/stores/connectStore';
import { showError } from '@/shared/theme/lib/toast';
import type { ActionScope } from '@/features/playback/shared/player/types/queueTypes';

export function actionScope(): ActionScope {
	const { target } = connectStore.getState();
	const me = getSession().user?.id ?? null;
	if (target.kind === 'local') return { ownerId: me, remote: false, call: {} };
	return {
		ownerId: target.ownerId,
		remote: true,
		call: {
			ownerId: target.ownerId === me ? undefined : target.ownerId,
			deviceId: target.deviceId,
		},
	};
}

export function handleRemoteRefusal(scope: ActionScope, error: unknown): boolean {
	if (!scope.remote || !(error instanceof ApiError)) return false;
	if (error.code === 'DEVICE_OFFLINE') {
		showError("Cet appareil n'est plus en ligne");
	} else if (error.code === 'QUEUE_ACCESS_DENIED') {
		showError('Vous ne pouvez plus contrôler cet appareil');
	} else {
		return false;
	}
	connectStore.getState().setLocal();
	return true;
}
