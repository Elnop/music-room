import { useEffect } from 'react';
import { useQueueState } from '@/features/playback/shared/player/hooks/useQueueState';
import { useQueueUpdates } from '@/features/playback/hooks/useQueueUpdates';

export function useQueueSync(): void {
	const load = useQueueState((state) => state.load);
	const applyState = useQueueState((state) => state.applyState);
	const reset = useQueueState((state) => state.reset);

	useEffect(() => {
		load();
		return () => reset();
	}, [load, reset]);

	useQueueUpdates(load, applyState);
}
