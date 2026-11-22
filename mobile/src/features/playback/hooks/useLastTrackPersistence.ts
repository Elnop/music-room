import { useEffect } from 'react';
import { useSession } from '@/shared/backend/hooks/useSession';
import { useLastTrackRestore } from '@/features/playback/hooks/useLastTrackRestore';
import { useLastTrackSaves } from '@/features/playback/hooks/useLastTrackSaves';
import { watchLastTrackSaves } from '@/features/playback/lib/watchLastTrackSaves';

export function useLastTrackPersistence(): void {
	const userId = useSession(session => session?.user?.id ?? null);
	const saveUserId = useLastTrackRestore(userId);

	useEffect(() => {
		if (!saveUserId) return;
		return watchLastTrackSaves(saveUserId);
	}, [saveUserId]);

	useLastTrackSaves(saveUserId);
}
