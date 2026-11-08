import { useEffect, useRef } from 'react';
import { useNetworkState } from 'expo-network';
import { useSocketStore } from '@/shared/stores/socketStore';

export type ConnectionStatus = 'offline' | 'reconnecting' | 'failed' | null;

export function useConnectionStatus(): ConnectionStatus {
	const network = useNetworkState();
	const status = useSocketStore(state => state.status);
	const retry = useSocketStore(state => state.retry);

	const offline = network.isConnected === false || network.isInternetReachable === false;

	const offlineSinceConnectedRef = useRef(false);

	useEffect(() => {
		if (offline) offlineSinceConnectedRef.current = true;
		else if (status === 'connected') offlineSinceConnectedRef.current = false;
		else if (status === 'failed' && offlineSinceConnectedRef.current) {
			offlineSinceConnectedRef.current = false;
			retry();
		}
	}, [offline, status, retry]);

	if (offline) return 'offline';
	if (status === 'reconnecting' || status === 'failed') return status;
	return null;
}
