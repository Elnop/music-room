import { useEffect, useRef } from 'react';
import { useNetworkState } from 'expo-network';
import { useSocketStore } from '@/shared/stores/socketStore';

/** What the connection banner shows; null hides it. */
export type ConnectionStatus = 'offline' | 'reconnecting' | 'failed' | null;

/**
 * Combines the device network state with the socket status (#315).
 *
 * Offline wins over the socket: without network, the socket state says
 * nothing useful. An unknown network field (undefined) counts as online.
 * When the socket gives up after a network loss, it retries it once.
 */
export function useConnectionStatus(): ConnectionStatus {
	const network = useNetworkState();
	const status = useSocketStore(state => state.status);
	const retry = useSocketStore(state => state.retry);

	const offline = network.isConnected === false || network.isInternetReachable === false;

	/** Set when the network was lost since the socket last connected. */
	const offlineSinceConnectedRef = useRef(false);

	useEffect(() => {
		if (offline) offlineSinceConnectedRef.current = true;
		else if (status === 'connected') offlineSinceConnectedRef.current = false;
		else if (status === 'failed' && offlineSinceConnectedRef.current) {
			// The network came back but the socket gave up (even after the
			// network returned): retry once. Otherwise a failed socket waits
			// for the user to tap « Réessayer ».
			offlineSinceConnectedRef.current = false;
			retry();
		}
	}, [offline, status, retry]);

	if (offline) return 'offline';
	if (status === 'reconnecting' || status === 'failed') return status;
	return null;
}
