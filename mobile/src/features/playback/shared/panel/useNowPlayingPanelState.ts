import { useStore } from 'zustand';
import type { ExtractState } from 'zustand';
import { nowPlayingPanelStore } from '@/features/playback/shared/panel/nowPlayingPanelStore';

export function useNowPlayingPanelState<T>(
	selector: (state: ExtractState<typeof nowPlayingPanelStore>) => T,
): T {
	return useStore(nowPlayingPanelStore, selector);
}
