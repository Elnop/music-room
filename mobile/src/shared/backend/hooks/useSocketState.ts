import { useStore } from 'zustand';
import { socketStore } from '@/shared/backend/socketStore';
import type { SocketState } from '@/shared/backend/types/socketTypes';

export function useSocketState<T>(selector: (state: SocketState) => T): T {
	return useStore(socketStore, selector);
}
