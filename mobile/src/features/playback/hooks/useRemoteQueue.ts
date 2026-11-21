import { useEffect } from 'react';
import { queueStore } from '@/features/playback/shared/player/stores/queueStore';

export function useRemoteQueue(ownerId: string | null, userId: string | null): void {
	useEffect(() => {
		if (!ownerId || ownerId === userId) return;
		const { load, forget } = queueStore.getState();
		void load(ownerId);
		return () => forget(ownerId);
	}, [ownerId, userId]);
}
