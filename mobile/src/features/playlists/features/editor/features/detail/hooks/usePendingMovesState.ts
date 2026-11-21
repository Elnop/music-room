import { useStore } from 'zustand';
import { pendingMovesStore } from '@/features/playlists/features/editor/shared/track-edits/pendingMovesStore';

export function usePendingMovesState<T>(selector: (state: { count: number }) => T): T {
	return useStore(pendingMovesStore, selector);
}
