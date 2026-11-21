import { useEffect } from 'react';
import { useSocketState } from '@/shared/backend/hooks/useSocketState';

export function useSocketConnection(isAuthenticated: boolean): void {
	const connect = useSocketState(state => state.connect);
	const disconnect = useSocketState(state => state.disconnect);
	useEffect(() => {
		if (isAuthenticated) {
			connect();
		} else {
			disconnect();
		}
	}, [isAuthenticated, connect, disconnect]);
}
