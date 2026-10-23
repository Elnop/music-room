import { useEffect, useCallback, useState } from 'react';
import { useSocketStore } from '@/shared/stores/socketStore';
import { musicControlApi } from '@/features/music-control/services/musicControlApi';
import type { ControlError } from '@/shared/utils/controlError';
import { logger } from '@/shared/utils/logger';

interface PermissionChangedEvent {
	ownerId: string;
	targetUserId: string;
	canControl: boolean;
}

interface ControllableIds {
	userId: string;
	allDevices: boolean;
	ids: string[];
}

const NO_IDS: string[] = [];

export function useControllableDevices(targetUserId: string | null) {
	const socket = useSocketStore(state => state.socket);
	const isConnected = useSocketStore(state => state.isConnected);

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

		const handlePermissionChanged = (data: PermissionChangedEvent) => {
			if (data.ownerId === targetUserId) reloadControllable();
		};

		const handleControlError = (err: ControlError) => {
			logger.error('[MusicControl] Control error:', err);
			setControlError({ code: err.code, message: err.message });
			if (err.code === 'NOT_AUTHORIZED') reloadControllable();
		};

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
