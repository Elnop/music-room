import { useEffect, useState } from 'react';
import { useSocketState } from '@/shared/backend/hooks/useSocketState';
import { controlEventHandlers } from '@/features/playback/features/control-delegation/lib/controlEventHandlers';
import type { ControlError } from '@/shared/control-error/controlErrorTypes';

export function useControlErrors(targetUserId: string | null, reload: () => void) {
	const socket = useSocketState((state) => state.socket);
	const isConnected = useSocketState((state) => state.isConnected);
	const [controlError, setControlError] = useState<ControlError | null>(null);

	useEffect(() => {
		if (!socket || !isConnected || !targetUserId) return;
		const { handlePermissionChanged, handleControlError } = controlEventHandlers(
			targetUserId,
			reload,
			setControlError,
		);
		socket.on('permission:changed', handlePermissionChanged);
		socket.on('control:error', handleControlError);
		return () => {
			socket.off('permission:changed', handlePermissionChanged);
			socket.off('control:error', handleControlError);
		};
	}, [socket, isConnected, targetUserId, reload]);

	return controlError;
}
