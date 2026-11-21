import { useEffect } from 'react';
import { useSocketState } from '@/shared/backend/hooks/useSocketState';
import { useSession } from '@/shared/backend/hooks/useSession';
import { useConnectState } from '@/features/playback/shared/player/hooks/useConnectState';
import { useRemoteQueue } from '@/features/playback/hooks/useRemoteQueue';
import { bindControl, bindListening } from '@/features/playback/lib/remoteListening';

export function useRemoteTarget(): void {
	const socket = useSocketState(state => state.socket);
	const isConnected = useSocketState(state => state.isConnected);
	const ownerId = useConnectState(state =>
		state.target.kind === 'remote' ? state.target.ownerId : null
	);
	const deviceId = useConnectState(state =>
		state.target.kind === 'remote' ? state.target.deviceId : null
	);
	useRemoteQueue(
		ownerId,
		useSession(state => state?.user?.id ?? null)
	);

	useEffect(() => {
		if (!socket || !isConnected || !ownerId || !deviceId) return;
		const unbindListening = bindListening(socket, { ownerId, deviceId });
		const unbindControl = bindControl(socket, { ownerId, deviceId });
		return () => {
			unbindListening();
			unbindControl();
		};
	}, [socket, isConnected, ownerId, deviceId]);
}
