import { useEffect, useState } from 'react';
import { lastTrackStorage } from '@/shared/playback/lastTrackStorage';
import { logger } from '@/shared/logging/logger';
import { restoreLastTrack } from '@/features/playback/lib/restoreLastTrack';

export function useLastTrackRestore(userId: string | null): string | null {
	const [restoredFor, setRestoredFor] = useState<string | null>(null);

	useEffect(() => {
		if (!userId) return;
		let cancelled = false;
		void lastTrackStorage
			.load(userId)
			.then((entry) => {
				if (cancelled) return;
				restoreLastTrack(entry);
				setRestoredFor(userId);
			})
			.catch((error) => {
				logger.warn('[lastTrackStorage] Load failed', error);
				if (!cancelled) setRestoredFor(userId);
			});
		return () => {
			cancelled = true;
		};
	}, [userId]);

	return userId !== null && restoredFor === userId ? userId : null;
}
