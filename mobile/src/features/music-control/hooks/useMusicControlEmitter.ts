import { useEffect, useState } from 'react';
import { useSocketStore } from '@/shared/stores/socketStore';
import {
	usePlaybackEmitterState,
	readPlaybackPositionMs,
	getPlayback,
} from '@/shared/services/playbackBridge';
import { getConnectBridge } from '@/shared/services/connectBridge';
import { useSession, getSession } from '@/shared/services/authSession';
import { deviceService, type DeviceInfo } from '@/shared/services/deviceService';
import { queueTrackToSoundCloud, trackToSoundCloud } from '@/shared/utils/trackToSoundCloud';
import type { DeviceCommand } from '@/types/queue.types';

type ControlCommand = DeviceCommand | { action: 'play'; fromUserId: string };

/** Use once, at the app root (RootNavigator). */
export function useMusicControlEmitter() {
	const socket = useSocketStore(state => state.socket);
	const isConnected = useSocketStore(state => state.isConnected);
	const user = useSession(state => state.user);

	const { currentTrack, isPlaying, seekCount } = usePlaybackEmitterState();
	const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

	useEffect(() => {
		deviceService.getDeviceInfo().then(info => {
			setDeviceInfo(info);
		});
	}, []);

	useEffect(() => {
		if (!socket || !isConnected || !user || !deviceInfo) return;

		const emitStatus = () => {
			const position = readPlaybackPositionMs();
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
				positionMs:
					position != null && Number.isFinite(position) ? Math.max(0, Math.round(position)) : 0,
			};

			socket.emit('listening:update', status);
		};

		const timer = setTimeout(emitStatus, 200);

		return () => clearTimeout(timer);
	}, [socket, isConnected, user, deviceInfo, currentTrack, isPlaying, seekCount]);

	useEffect(() => {
		if (!socket || !isConnected) return;

		const handleControlCommand = (data: ControlCommand) => {
			const playback = getPlayback();
			switch (data.action) {
				case 'play':
					playback.resume();
					break;
				case 'pause':
					playback.pause();
					break;
				case 'play-item': {
					const { item, positionMs, version } = data;
					playback.playTrack(trackToSoundCloud(item), item.id, positionMs);
					const me = getSession().user?.id;
					if (me) playback.setCurrentQueueItem?.(me, item.id, version);
					getConnectBridge().setLocal();
					break;
				}
				case 'play-track':
					playback.playTrack(queueTrackToSoundCloud(data.track), undefined, data.positionMs);
					getConnectBridge().setLocal();
					break;
			}
		};

		socket.on('control:command', handleControlCommand);

		return () => {
			socket.off('control:command', handleControlCommand);
		};
	}, [socket, isConnected]);
}
