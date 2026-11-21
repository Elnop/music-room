import { useMemo } from 'react';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import { useActiveQueue } from '@/features/playback/shared/player/hooks/useActiveQueue';
import { UP_NEXT_COUNT } from '@/features/playback/shared/player/configs/playerConfig';
import { upNext } from '@/features/playback/features/now-playing-panel/upNext';
import type { PanelUpNext } from '@/features/playback/features/now-playing-panel/nowPlayingPanelTypes';

export function usePanelUpNext(isRemote: boolean): PanelUpNext {
	const queue = useActiveQueue();
	const localTrack = usePlayerState(state => state.currentTrack);
	const next = useMemo(() => upNext(queue, UP_NEXT_COUNT), [queue]);
	const source = next.current?.track ?? (isRemote ? null : localTrack);
	return { items: next.items, total: next.total, source };
}
