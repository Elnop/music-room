import { useStore } from 'zustand';
import type { ExtractState } from 'zustand';
import { alertStore } from '@/shared/alerts/alertStore';

export function useAlertState<T>(selector: (state: ExtractState<typeof alertStore>) => T): T {
	return useStore(alertStore, selector);
}
