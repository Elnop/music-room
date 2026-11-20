import { useEffect } from 'react';
import { useSocketStore } from '@/shared/backend/socketStore';

export function useSocketConnection(isAuthenticated: boolean): void {
	const connect = useSocketStore(state => state.connect);
	const disconnect = useSocketStore(state => state.disconnect);
	useEffect(() => {
		if (isAuthenticated) {
			connect();
		} else {
			disconnect();
		}
	}, [isAuthenticated, connect, disconnect]);
}
