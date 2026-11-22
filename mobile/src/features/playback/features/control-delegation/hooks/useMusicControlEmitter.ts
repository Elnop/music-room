import { useEffect } from 'react';
import { useSocketState } from '@/shared/backend/hooks/useSocketState';
import { useSession } from '@/shared/backend/hooks/useSession';
import { watchListeningStatus } from '@/features/playback/features/control-delegation/lib/watchListeningStatus';
import { useControlCommands } from '@/features/playback/features/control-delegation/hooks/useControlCommands';
import { useDeviceInfo } from '@/features/playback/features/control-delegation/hooks/useDeviceInfo';

export function useMusicControlEmitter() {
	const deviceInfo = useDeviceInfo();
	const socket = useSocketState((state) => state.socket);
	const isConnected = useSocketState((state) => state.isConnected);
	const user = useSession((state) => state.user);

	useEffect(() => {
		if (!socket || !isConnected || !user || !deviceInfo) return;
		return watchListeningStatus(socket);
	}, [socket, isConnected, user, deviceInfo]);

	useControlCommands();
}
