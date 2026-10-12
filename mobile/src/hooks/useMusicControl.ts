import { useEffect, useCallback, useMemo, useState } from 'react';
import { useSocketStore } from '@store/socketStore';
import { usePlayerStore } from '@store/playerStore';
import { useAuthStore } from '@store/authStore';
import { deviceService, type DeviceInfo } from '@/services/deviceService';
import { musicControlApi } from '@/services/musicControlApi';

/**
 * Listening status for a single device
 */
export interface ListeningStatus {
	ownerId: string;
	device: DeviceInfo;
	track: {
		id: number;
		title: string;
		artist: string;
		artworkUrl: string | null;
	} | null;
	isPlaying: boolean;
	updatedAt: string;
}

/**
 * Aggregated listening status for a user (all devices)
 */
export interface UserListeningStatus {
	ownerId: string;
	devices: ListeningStatus[];
}

interface ControlCommand {
	action: 'play' | 'pause';
	fromUserId: string;
}

interface PermissionChangedEvent {
	ownerId: string;
	targetUserId: string;
	canControl: boolean;
}

/**
 * Hook to manage music control - emits listening status and receives remote commands
 * Should be used at app root level (e.g., in RootNavigator or App)
 *
 * Multi-device support: each device is uniquely identified and can be controlled independently
 */
export function useMusicControlEmitter() {
	const socket = useSocketStore(state => state.socket);
	const isConnected = useSocketStore(state => state.isConnected);
	const user = useAuthStore(state => state.user);

	const currentTrack = usePlayerStore(state => state.currentTrack);
	const isPlaying = usePlayerStore(state => state.isPlaying);
	const pause = usePlayerStore(state => state.pause);
	const resume = usePlayerStore(state => state.resume);

	const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

	useEffect(() => {
		deviceService.getDeviceInfo().then(info => {
			setDeviceInfo(info);
			if (__DEV__)
				console.log('[MusicControl] Device info loaded:', info.deviceName, info.deviceId);
		});
	}, []);

	useEffect(() => {
		if (!socket || !isConnected || !user || !deviceInfo) return;

		const emitStatus = () => {
			const status = {
				track: currentTrack
					? {
							id: currentTrack.id,
							title: currentTrack.title,
							artist: currentTrack.user.username,
							artworkUrl: currentTrack.artwork_url,
						}
					: null,
				isPlaying,
			};

			socket.emit('listening:update', status);
			if (__DEV__)
				console.log(
					'[MusicControl] Emitted listening status:',
					status.track?.title,
					status.isPlaying,
					'from',
					deviceInfo.deviceName
				);
		};

		const timer = setTimeout(emitStatus, 200);

		return () => clearTimeout(timer);
	}, [socket, isConnected, user, deviceInfo, currentTrack, isPlaying]);

	useEffect(() => {
		if (!socket || !isConnected) return;

		const handleControlCommand = (data: ControlCommand) => {
			if (__DEV__) console.log('[MusicControl] Received control command:', data);

			if (data.action === 'play') {
				resume();
			} else if (data.action === 'pause') {
				pause();
			}
		};

		socket.on('control:command', handleControlCommand);

		return () => {
			socket.off('control:command', handleControlCommand);
		};
	}, [socket, isConnected, pause, resume]);
}

/**
 * A friend's device as seen from their profile, with whether I may control it
 */
export interface FriendDeviceStatus extends ListeningStatus {
	controllable: boolean;
}

/**
 * Last `control:error` received from the server for a remote command
 */
export interface ControlError {
	code: string;
	message: string;
}

/**
 * Text to show the user for a `control:error`
 */
export function controlErrorMessage(err: ControlError): string {
	switch (err.code) {
		case 'NOT_AUTHORIZED':
			return 'Vous ne pouvez pas contrôler cet appareil';
		case 'DEVICE_OFFLINE':
			return "Cet appareil n'est plus en ligne";
		default:
			return err.message;
	}
}

interface ControllableIds {
	userId: string;
	allDevices: boolean;
	ids: string[];
}

const NO_IDS: string[] = [];

/**
 * Hook to subscribe to a friend's listening status (all devices) and control their music
 * Use this in UserProfileScreen when viewing a friend
 *
 * Only the devices the friend let me control (all-devices switch or per-device license)
 * get controls; the listening status is subscribed only when at least one is controllable.
 */
export function useFriendListening(targetUserId: string | null) {
	const socket = useSocketStore(state => state.socket);
	const isConnected = useSocketStore(state => state.isConnected);

	const [statuses, setStatuses] = useState<ListeningStatus[]>([]);
	const [controllable, setControllable] = useState<ControllableIds | null>(null);
	const [reloadCount, setReloadCount] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [controlError, setControlError] = useState<ControlError | null>(null);

	const reloadControllable = useCallback(() => setReloadCount(count => count + 1), []);

	// Devices I may control: the list belongs to one user, ignore a stale one
	const current = controllable && controllable.userId === targetUserId ? controllable : null;
	const allDevices = current?.allDevices ?? false;
	const controllableIds = current ? current.ids : NO_IDS;
	const canControl = allDevices || controllableIds.length > 0;
	// The all-devices switch also covers devices that connected after the list was loaded
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
				console.error('[MusicControl] Load controllable devices failed:', err);
				if (!cancelled) setControllable({ userId: targetUserId, allDevices: false, ids: [] });
			});

		return () => {
			cancelled = true;
		};
	}, [targetUserId, reloadCount]);

	useEffect(() => {
		if (!socket || !isConnected || !targetUserId) return;

		const handlePermissionChanged = (data: PermissionChangedEvent) => {
			if (__DEV__) console.log('[MusicControl] Permission changed:', data);
			if (data.ownerId === targetUserId) reloadControllable();
		};

		const handleControlError = (err: ControlError) => {
			console.error('[MusicControl] Control error:', err);
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

	useEffect(() => {
		if (!socket || !isConnected || !targetUserId || !canControl) {
			if (!canControl) {
				setStatuses([]);
				setIsLoading(false);
			}
			return;
		}

		setIsLoading(true);
		setError(null);

		const subscribeTimer = setTimeout(() => {
			socket.emit('listening:subscribe', targetUserId);
			if (__DEV__) console.log('[MusicControl] Subscribed to listening status of:', targetUserId);
		}, 200);

		const handleStatus = (status: UserListeningStatus) => {
			if (__DEV__)
				console.log('[MusicControl] Received listening status:', status.devices.length, 'devices');
			if (status.ownerId === targetUserId) {
				setStatuses(status.devices);
				setIsLoading(false);
			}
		};

		const handleError = (err: { message: string; code: string }) => {
			console.error('[MusicControl] Error:', err);
			setError(err.message);
			setIsLoading(false);
		};

		socket.on('listening:status', handleStatus);
		socket.on('listening:error', handleError);

		return () => {
			clearTimeout(subscribeTimer);
			socket.off('listening:status', handleStatus);
			socket.off('listening:error', handleError);
			if (socket.connected) {
				socket.emit('listening:unsubscribe', targetUserId);
				if (__DEV__) console.log('[MusicControl] Unsubscribed from:', targetUserId);
			}
		};
	}, [socket, isConnected, targetUserId, canControl]);

	const devices = useMemo<FriendDeviceStatus[]>(
		() =>
			statuses.map(status => ({
				...status,
				controllable: isControllable(status.device.deviceId),
			})),
		[statuses, isControllable]
	);

	const sendAction = useCallback(
		(targetDeviceId: string, action: 'play' | 'pause') => {
			if (!socket || !isConnected || !targetUserId) return;
			if (!isControllable(targetDeviceId)) {
				if (__DEV__) console.log('[MusicControl] Device not controllable:', targetDeviceId);
				return;
			}

			socket.emit('control:action', { targetUserId, targetDeviceId, action });
			if (__DEV__) console.log(`[MusicControl] Sent ${action} command to device:`, targetDeviceId);
		},
		[socket, isConnected, targetUserId, isControllable]
	);

	const remotePlay = useCallback(
		(targetDeviceId: string) => sendAction(targetDeviceId, 'play'),
		[sendAction]
	);

	const remotePause = useCallback(
		(targetDeviceId: string) => sendAction(targetDeviceId, 'pause'),
		[sendAction]
	);

	return {
		devices,
		canControl,
		isLoading,
		error,
		controlError,
		remotePlay,
		remotePause,
	};
}
