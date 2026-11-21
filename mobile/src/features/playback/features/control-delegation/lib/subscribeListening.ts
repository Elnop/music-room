import type { Socket } from 'socket.io-client';
import {
	acquireListening,
	releaseListening,
} from '@/features/playback/shared/listening-rooms/listeningRooms';
import { listeningHandlers } from '@/features/playback/features/control-delegation/lib/listeningHandlers';
import type { SetListening } from '@/features/playback/features/control-delegation/controlDelegationTypes';

export function subscribeListening(
	socket: Socket,
	targetUserId: string,
	setListening: SetListening
): () => void {
	let subscribed = false;
	const subscribeTimer = setTimeout(() => {
		setListening(current => ({ ...current, isLoading: true, error: null }));
		acquireListening(socket, targetUserId);
		subscribed = true;
	}, 200);
	const { handleStatus, handleError } = listeningHandlers(targetUserId, setListening);
	socket.on('listening:status', handleStatus);
	socket.on('listening:error', handleError);

	return () => {
		clearTimeout(subscribeTimer);
		socket.off('listening:status', handleStatus);
		socket.off('listening:error', handleError);
		if (subscribed) releaseListening(socket, targetUserId);
	};
}
