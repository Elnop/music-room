import { useEffect, useCallback, useState } from 'react';
import { useSocketState } from '@/shared/backend/hooks/useSocketState';
import { musicControlApi } from '@/features/playback/features/control-delegation/shared/delegation/lib/musicControlApi';
import type { ControlError } from '@/shared/control-error/controlErrorTypes';
import { logger } from '@/shared/logging/logger';

type PermissionChangedEvent = {
	ownerId: string;
	targetUserId: string;
	canControl: boolean;
};

type ControllableIds = {
	userId: string;
	allDevices: boolean;
	ids: string[];
};

const NO_IDS: string[] = [];

export function useControllableDevices(targetUserId: string | null) {
	const socket = useSocketState(state => state.socket);
	const isConnected = useSocketState(state => state.isConnected);

	const [controllable, setControllable] = useState<ControllableIds | null>(null);
	const [reloadCount, setReloadCount] = useState(0);
	const [controlError, setControlError] = useState<ControlError | null>(null);

	const reloadControllable = useCallback(() => setReloadCount(count => count + 1), []);

	const current = controllable && controllable.userId === targetUserId ? controllable : null;
	const allDevices = current?.allDevices ?? false;
	const controllableIds = current ? current.ids : NO_IDS;
	const canControl = allDevices || controllableIds.length > 0;

	const isControllable = useCallback(
		(deviceId: string) => allDevices || controllableIds.includes(deviceId),
		[allDevices, controllableIds]
	);

	useEffect(() => {
		if (!targetUserId) return;
		let cancelled = false;

		musicControlApi
			.getControllableDevices(targetUserId)
			.then(res => {
				if (!cancelled) {
					setControllable({
						userId: targetUserId,
						allDevices: res.allDevices,
						ids: res.devices.map(d => d.deviceId),
					});
				}
			})
			.catch(err => {
				logger.error('[MusicControl] Load controllable devices failed:', err);
				if (!cancelled) setControllable({ userId: targetUserId, allDevices: false, ids: [] });
			});

		return () => {
			cancelled = true;
		};
	}, [targetUserId, reloadCount]);

	useEffect(() => {
		if (!socket || !isConnected || !targetUserId) return;

		function handlePermissionChanged(data: PermissionChangedEvent) {
			if (data.ownerId === targetUserId) reloadControllable();
		}

		function handleControlError(err: ControlError) {
			logger.error('[MusicControl] Control error:', err);
			setControlError({ code: err.code, message: err.message });
			if (err.code === 'NOT_AUTHORIZED') reloadControllable();
		}

		socket.on('permission:changed', handlePermissionChanged);
		socket.on('control:error', handleControlError);

		return () => {
			socket.off('permission:changed', handlePermissionChanged);
			socket.off('control:error', handleControlError);
		};
	}, [socket, isConnected, targetUserId, reloadControllable]);

	return {
		canControl,
		isControllable,
		controlError,
	};
}
