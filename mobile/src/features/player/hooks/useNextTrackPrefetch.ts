import { useEffect, useRef } from 'react';
import { useAudioPlayerStatus, type useAudioPlayer } from 'expo-audio';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { useConnectStore } from '@/store/connectStore';
import { useActiveQueue } from '@/store/queueStore';
import { nextItem } from '@/store/queueSelectors';
import { streamPrefetch } from '@/features/player/services/streamPrefetch';
import { fetchStreamUrl } from '@/features/player/services/streamApi';
import { trackToSoundCloud } from '@/shared/utils/trackToSoundCloud';
import { FETCH_TIMEOUT_MS, PREFETCH_WINDOW_S } from '@/features/player/constants';

function playsLocally(): boolean {
	return useConnectStore.getState().target.kind === 'local';
}

/**
 * Fetches the stream URL of the queue's next item in the last PREFETCH_WINDOW_S
 * seconds of a track played locally (#314).
 */
export function useNextTrackPrefetch(player: ReturnType<typeof useAudioPlayer>): void {
	const status = useAudioPlayerStatus(player);
	const isPlaying = usePlayerStore(state => state.playbackState === 'playing');
	const isLocal = useConnectStore(state => state.target.kind === 'local');
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
