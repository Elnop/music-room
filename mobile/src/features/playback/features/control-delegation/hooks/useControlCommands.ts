import { useEffect } from 'react';
import { useSocketState } from '@/shared/backend/hooks/useSocketState';
import { handleControlCommand } from '@/features/playback/features/control-delegation/lib/handleControlCommand';

export function useControlCommands() {
	const socket = useSocketState(state => state.socket);
	const isConnected = useSocketState(state => state.isConnected);

	useEffect(() => {
		if (!socket || !isConnected) return;
		socket.on('control:command', handleControlCommand);
		return () => {
			socket.off('control:command', handleControlCommand);
		};
	}, [socket, isConnected]);
}
