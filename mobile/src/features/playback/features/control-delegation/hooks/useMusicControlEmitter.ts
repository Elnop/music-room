import { useEffect, useState } from 'react';
import { useSocketStore } from '@/shared/backend/socketStore';
import { useSession, getSession } from '@/shared/backend/lib/authSession';
import { deviceService } from '@/shared/backend/deviceService';
import type { DeviceInfo } from '@/shared/backend/deviceService';
import {
	queueTrackToSoundCloud,
	trackToSoundCloud,
} from '@/features/playback/shared/player/lib/trackToSoundCloud';
import type { DeviceCommand } from '@/shared/playback/lib/queue.types';
import { useConnectStore } from '@/features/playback/shared/player/stores/connectStore';
import {
	readPositionMs,
	usePlayerStore,
} from '@/features/playback/shared/player/stores/playerStore';
import { useQueueStore } from '@/features/playback/shared/player/stores/queueStore';

type ControlCommand = DeviceCommand | { action: 'play'; fromUserId: string };

export function useMusicControlEmitter() {
	const socket = useSocketStore(state => state.socket);
	const isConnected = useSocketStore(state => state.isConnected);
	const user = useSession(state => state.user);

	const currentTrack = usePlayerStore(state => state.currentTrack);
	const isPlaying = usePlayerStore(state => state.isPlaying);
	const seekCount = usePlayerStore(state => state.seekCount);
	const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

	useEffect(() => {
		deviceService.getDeviceInfo().then(info => {
			setDeviceInfo(info);
		});
	}, []);

	useEffect(() => {
		if (!socket || !isConnected || !user || !deviceInfo) return;
		const connectedSocket = socket;

		function emitStatus() {
			const position = readPositionMs();
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

			connectedSocket.emit('listening:update', status);
		}

		const timer = setTimeout(emitStatus, 200);

		return () => clearTimeout(timer);
	}, [socket, isConnected, user, deviceInfo, currentTrack, isPlaying, seekCount]);

	useEffect(() => {
		if (!socket || !isConnected) return;

		function handleControlCommand(data: ControlCommand) {
			const playback = usePlayerStore.getState();
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
					if (me) useQueueStore.getState().setCurrentItem(me, item.id, version);
					useConnectStore.getState().setLocal();
					break;
				}
				case 'play-track':
					playback.playTrack(queueTrackToSoundCloud(data.track), undefined, data.positionMs);
					useConnectStore.getState().setLocal();
					break;
			}
		}

		socket.on('control:command', handleControlCommand);

		return () => {
			socket.off('control:command', handleControlCommand);
		};
	}, [socket, isConnected]);
}
