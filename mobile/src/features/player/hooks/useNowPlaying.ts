import { useCallback, useMemo } from 'react';
import { usePlayer } from '@/features/player/context/PlayerContext';
import { usePlayerProgress } from './usePlayerProgress';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { useActiveQueue, useQueueStore } from '@/store/queueStore';
import { previousAction, selectHasNext, selectHasPrevious } from '@/store/queueSelectors';
import { useRemoteNowPlaying } from './useRemoteNowPlaying';

import type { NowPlaying, NowPlayingTrack } from '@/features/player/types';

export type { NowPlaying, NowPlayingTrack } from '@/features/player/types';

/**
 * The single view of "what plays" for the mini-player, modal, and system controls (#297).
 */
export function useNowPlaying(): NowPlaying {
	const remote = useRemoteNowPlaying();
	const { player, seekTo } = usePlayer();
	const { currentTime, duration } = usePlayerProgress();
	const currentTrack = usePlayerStore(state => state.currentTrack);
	const playbackState = usePlayerStore(state => state.playbackState);
	const queueItemId = usePlayerStore(state => state.queueItemId);
	const needsStreamLoad = usePlayerStore(state => state.needsStreamLoad);
	const restoredPositionMs = usePlayerStore(state => state.startPositionMs ?? 0);
	const queue = useActiveQueue();
	const queueNext = useQueueStore(state => state.next);
	const queuePrevious = useQueueStore(state => state.previous);

	const localTrack = useMemo<NowPlayingTrack | null>(
		() =>
			currentTrack
				? {
						id: currentTrack.id,
						title: currentTrack.title,
						artist: currentTrack.user.username,
						artworkUrl: currentTrack.artwork_url || currentTrack.user.avatar_url || null,
					}
				: null,
		[currentTrack]
	);

	const localHasPrevious = selectHasPrevious(queue) && queueItemId !== null;
	const localPositionMs = needsStreamLoad ? restoredPositionMs : currentTime * 1000;

	const localPrevious = useCallback(() => {
		if (!player) return;
		if (previousAction(localPositionMs / 1000, localHasPrevious) === 'restart') {
			seekTo(0);
		} else {
			void queuePrevious();
		}
	}, [player, seekTo, localPositionMs, localHasPrevious, queuePrevious]);

	const next = useCallback(() => {
		void queueNext();
	}, [queueNext]);

	const isPlaying = playbackState === 'playing';
	const canToggle = !!currentTrack && (isPlaying || playbackState === 'paused');

	const toggle = () => {
		if (!canToggle || !player) return;
		const { pause, resume } = usePlayerStore.getState();
		if (isPlaying) pause();
		else resume();
	};

	if (remote) return remote;

	return {
		isRemote: false,
		track: localTrack,
		isPlaying,
		isLoading: playbackState === 'loading',
		canToggle,
		positionMs: localPositionMs,
		durationMs: needsStreamLoad && currentTrack ? currentTrack.duration : duration * 1000,
		deviceLabel: null,
		toggle,
		next,
		previous: localPrevious,
		hasNext: selectHasNext(queue),
		hasPrevious: localHasPrevious,
	};
}
