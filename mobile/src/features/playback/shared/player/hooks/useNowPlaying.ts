import { useLocalNowPlaying } from '@/features/playback/shared/player/hooks/useLocalNowPlaying';
import { useRemoteNowPlaying } from '@/features/playback/shared/player/hooks/useRemoteNowPlaying';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';

export function useNowPlaying(): NowPlaying {
	const remote = useRemoteNowPlaying();
	const local = useLocalNowPlaying();
	return remote ?? local;
}
