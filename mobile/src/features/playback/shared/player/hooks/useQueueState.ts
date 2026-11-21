import { useStore } from 'zustand';
import { queueStore } from '@/features/playback/shared/player/stores/queueStore';
import type { QueueStoreState } from '@/features/playback/shared/player/types/queueTypes';

export function useQueueState<T>(selector: (state: QueueStoreState) => T): T {
	return useStore(queueStore, selector);
}
