import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { usePlayerProgress } from '@/hooks/usePlayerProgress';
import { usePlayerStore } from '@/store/playerStore';
import { useConnectStore } from '@/store/connectStore';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';
import { useActiveQueue, useQueueStore } from '@/store/queueStore';
import {
	previousAction,
	selectHasNext,
	selectHasPrevious,
	type OwnerQueue,
} from '@/store/queueSelectors';
import { hashStringToNumber } from '@utils/trackToSoundCloud';
import { estimatePositionMs } from '@utils/remotePosition';

/** What the player shows of a track, wherever it plays. */
export interface NowPlayingTrack {
	id: number;
	title: string;
	artist: string;
	artworkUrl: string | null;
}

export interface NowPlaying {
	/** True when the phone drives another device (#297). */
	isRemote: boolean;
	track: NowPlayingTrack | null;
	isPlaying: boolean;
	/** The phone's stream is loading (local mode only). */
	isLoading: boolean;
	/** Play / pause can act now. */
	canToggle: boolean;
	positionMs: number;
	/** Track length; null when unknown (remote track that is not the owner's current queue item). */
	durationMs: number | null;
	/** Name of the device that plays in remote mode (« Tablette de Léa »), else null. */
	deviceLabel: string | null;
	toggle: () => void;
	next: () => void;
	/** Previous item; in local mode, past a few seconds or off the queue, restarts the track. */
	previous: () => void;
	hasNext: boolean;
	/** A queue item to step back to exists (a list-tapped track has none). */
	hasPrevious: boolean;
}

/** Refresh rate of the estimated remote progress. */
const REMOTE_TICK_MS = 1000;

/** Duration of the owner's current queue item when it is the track the device plays. */
function remoteDurationMs(queue: OwnerQueue, trackId: number | undefined): number | null {
	if (trackId === undefined) return null;
	const current = queue.items.find(item => item.id === queue.currentItemId);
	return current && hashStringToNumber(current.track.trackUri) === trackId
		? current.track.durationMs
		: null;
}

/**
 * The one view of "what plays" for the mini-player and the modal (#297): the
 * phone's own audio in local mode, the targeted device's `listening:status` in
 * remote mode. In remote mode play / pause go through `control:action` and
 * next / previous through the queue routes with `deviceId`; the phone plays
 * nothing and cannot seek.
 */
export function useNowPlaying(): NowPlaying {
	const { player, seekTo } = usePlayer();
	const { currentTime, duration } = usePlayerProgress();
	const currentTrack = usePlayerStore(state => state.currentTrack);
	const playbackState = usePlayerStore(state => state.playbackState);
	const queueItemId = usePlayerStore(state => state.queueItemId);
	// A restored track has no player loaded: its position and length come from the store (#312).
	const needsStreamLoad = usePlayerStore(state => state.needsStreamLoad);
	const restoredPositionMs = usePlayerStore(state => state.startPositionMs ?? 0);
	const target = useConnectStore(state => state.target);
	const remoteStatus = useConnectStore(state => state.remoteStatus);
	const userId = useAuthStore(state => state.user?.id ?? null);
	const queue = useActiveQueue();
	const queueNext = useQueueStore(state => state.next);
	const queuePrevious = useQueueStore(state => state.previous);

	const isRemote = target.kind === 'remote';
	const remotePlaying = isRemote && (remoteStatus?.isPlaying ?? false);

	// Re-render every second while a remote device plays, for its estimated progress.
	// A `now` older than the status only holds the sent position until the next tick.
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		if (!remotePlaying) return;
		const timer = setInterval(() => setNow(Date.now()), REMOTE_TICK_MS);
		return () => clearInterval(timer);
	}, [remotePlaying]);

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

	if (target.kind === 'remote') {
		const track = remoteStatus?.track ?? null;
		const durationMs = remoteDurationMs(queue, track?.id);
		const deviceName = remoteStatus?.device.deviceName ?? 'un autre appareil';
		const deviceLabel =
			target.ownerId !== userId && target.ownerUsername
				? `${deviceName} de ${target.ownerUsername}`
				: deviceName;

		const toggle = () => {
			if (!track) return;
			const socket = useSocketStore.getState().socket;
			if (!socket) return;
			useConnectStore.getState().setControlPending(true);
			socket.emit('control:action', {
				targetUserId: target.ownerId,
				targetDeviceId: target.deviceId,
				action: remotePlaying ? 'pause' : 'play',
			});
		};

		return {
			isRemote: true,
			track,
			isPlaying: remotePlaying,
			isLoading: false,
			canToggle: track !== null,
			positionMs: remoteStatus ? estimatePositionMs(remoteStatus, now, durationMs) : 0,
			durationMs,
			deviceLabel,
			toggle,
			next,
			previous: () => void queuePrevious(),
			hasNext: selectHasNext(queue),
			hasPrevious: selectHasPrevious(queue),
		};
	}

	const isPlaying = playbackState === 'playing';
	const canToggle = !!currentTrack && (isPlaying || playbackState === 'paused');

	const toggle = () => {
		if (!canToggle || !player) return;
		const { pause, resume } = usePlayerStore.getState();
		if (isPlaying) pause();
		else resume();
	};

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
