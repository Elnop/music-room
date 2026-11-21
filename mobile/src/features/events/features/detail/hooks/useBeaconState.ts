import { useStore } from 'zustand';
import type { ExtractState } from 'zustand';
import { beaconStore } from '@/features/events/features/detail/beaconStore';

export function useBeaconState<T>(selector: (state: ExtractState<typeof beaconStore>) => T): T {
	return useStore(beaconStore, selector);
}
