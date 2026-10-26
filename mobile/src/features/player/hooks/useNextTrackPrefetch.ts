import { useEffect, useRef } from 'react';
import { useAudioPlayerStatus } from '@/features/player/services/audioPlayer';
import type { AudioPlayer } from '@/features/player/types';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { isLocalTarget, useIsLocalTarget } from '@/shared/services/connectBridge';
import { useActiveQueue } from '@/shared/services/playbackBridge';
import { nextItem } from '@/shared/utils/queueNavigation';
import { streamPrefetch } from '@/features/player/services/streamPrefetch';
import { fetchStreamUrl } from '@/features/player/services/streamApi';
import { trackToSoundCloud } from '@/shared/utils/trackToSoundCloud';
import { FETCH_TIMEOUT_MS, PREFETCH_WINDOW_S } from '@/features/player/constants';

function playsLocally(): boolean {
	return isLocalTarget();
}

/** Only for a track played locally, in its last PREFETCH_WINDOW_S seconds. */
export function useNextTrackPrefetch(player: AudioPlayer): void {
	const status = useAudioPlayerStatus(player);
	const isPlaying = usePlayerStore(state => state.playbackState === 'playing');
	const isLocal = useIsLocalTarget();
	const queue = useActiveQueue();
	const queueCurrentId = queue.currentItemId;
	const next = nextItem(queue);
	const nextId = next?.id ?? null;
	const nextPermalink = next ? trackToSoundCloud(next).permalink_url : null;
	const nextKey = nextId !== null && nextPermalink !== null ? `${nextId} ${nextPermalink}` : null;

	const nextKeyRef = useRef(nextKey);
	useEffect(() => {
		nextKeyRef.current = nextKey;
	}, [nextKey]);

	const requestedKeyRef = useRef<string | null>(null);
	const playingItemId = usePlayerStore(state => state.queueItemId);

	useEffect(() => {
		requestedKeyRef.current = null;
	}, [playingItemId]);

	const ownStatus = status !== undefined && status.id === player?.id;
	const duration = ownStatus ? (status.duration ?? 0) : 0;
	const currentTime = ownStatus ? (status.currentTime ?? 0) : 0;
	const inWindow = duration > 0 && duration - currentTime <= PREFETCH_WINDOW_S;

	useEffect(() => {
		const held = streamPrefetch.peek();
		if (!held) return;
		const stillWanted =
			nextKey === `${held.queueItemId} ${held.permalink}` || held.queueItemId === queueCurrentId;
		if (!isLocal || !stillWanted) streamPrefetch.clear();
	}, [isLocal, nextKey, queueCurrentId]);

	const stepping = playingItemId !== null && playingItemId !== queueCurrentId;

	useEffect(() => {
		if (!isLocal || !isPlaying || !inWindow || stepping) return;
		if (nextKey === null || nextId === null || nextPermalink === null) return;
		if (requestedKeyRef.current === nextKey) return;
		requestedKeyRef.current = nextKey;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
		fetchStreamUrl(nextPermalink, controller.signal)
			.then(({ streamUrl, expiresAt }) => {
				if (nextKeyRef.current !== nextKey || !playsLocally()) return;
				streamPrefetch.set({
					queueItemId: nextId,
					permalink: nextPermalink,
					streamUrl,
					expiresAt,
				});
			})
			.catch(() => undefined)
			.finally(() => clearTimeout(timeoutId));
	}, [isLocal, isPlaying, inWindow, stepping, nextKey, nextId, nextPermalink]);
}
