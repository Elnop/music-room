import { useStore } from 'zustand';
import type { ExtractState } from 'zustand';
import { volumeStore } from '@/features/playback/shared/volume/volumeStore';

export function useVolumeState<T>(selector: (state: ExtractState<typeof volumeStore>) => T): T {
	return useStore(volumeStore, selector);
}
