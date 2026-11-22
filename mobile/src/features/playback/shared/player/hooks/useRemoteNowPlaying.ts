import { useSession } from '@/shared/backend/hooks/useSession';
import { useActiveQueue } from '@/features/playback/shared/player/hooks/useActiveQueue';
import { useConnectState } from '@/features/playback/shared/player/hooks/useConnectState';
import { useRemoteClock } from '@/features/playback/shared/player/hooks/useRemoteClock';
import { remoteNowPlaying } from '@/features/playback/shared/player/lib/remoteNowPlaying';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';

export function useRemoteNowPlaying(): NowPlaying | null {
	const target = useConnectState((state) => state.target);
	const status = useConnectState((state) => state.remoteStatus);
	const userId = useSession((session) => session?.user?.id ?? null);
	const queue = useActiveQueue();
	const now = useRemoteClock(target, status);

	if (target.kind !== 'remote') return null;
	return remoteNowPlaying({ target, status, queue, now, userId });
}
