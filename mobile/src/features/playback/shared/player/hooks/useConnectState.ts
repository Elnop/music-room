import { useStore } from 'zustand';
import { connectStore } from '@/features/playback/shared/player/stores/connectStore';
import type { ConnectState } from '@/features/playback/shared/player/types/queueTypes';

export function useConnectState<T>(selector: (state: ConnectState) => T): T {
	return useStore(connectStore, selector);
}
