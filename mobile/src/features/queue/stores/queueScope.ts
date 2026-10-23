import { ApiError } from '@/shared/services/api';
import { getSession } from '@/shared/services/authSession';
import { useConnectStore } from '@/features/queue/stores/connectStore';
import { showError } from '@/shared/utils/toast';
import type { ActionScope } from '@/features/queue/types';

export interface StepOptions {
	errorMessage?: string | ((error: unknown) => string);
	stopWhenEmpty?: boolean;
}

export const actionScope = (): ActionScope => {
	const { target } = useConnectStore.getState();
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
};

export const handleRemoteRefusal = (scope: ActionScope, error: unknown): boolean => {
	if (!scope.remote || !(error instanceof ApiError)) return false;
	if (error.code === 'DEVICE_OFFLINE') {
		showError("Cet appareil n'est plus en ligne");
	} else if (error.code === 'QUEUE_ACCESS_DENIED') {
		showError('Vous ne pouvez plus contrôler cet appareil');
	} else {
		return false;
	}
	useConnectStore.getState().setLocal();
	return true;
};
