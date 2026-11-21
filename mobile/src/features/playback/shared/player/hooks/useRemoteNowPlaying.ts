import { useEffect, useState } from 'react';
import { useSession } from '@/shared/backend/lib/authSession';
import { useSocketStore } from '@/shared/backend/socketStore';
import type { OwnerQueue } from '@/features/playback/shared/player/lib/queue.types';
import {
	selectHasNext,
	selectHasPrevious,
} from '@/features/playback/shared/player/lib/queueNavigation';
import { hashStringToNumber } from '@/features/playback/shared/player/lib/trackToSoundCloud';
import { estimatePositionMs } from '@/features/playback/shared/player/lib/remotePosition';
import type { NowPlaying } from '@/features/playback/shared/player/lib/types';
import { useActiveQueue, useQueueStore } from '@/features/playback/shared/player/stores/queueStore';
import { useConnectStore } from '@/features/playback/shared/player/stores/connectStore';

const REMOTE_TICK_MS = 1000;

function remoteDurationMs(queue: OwnerQueue, trackId: number | undefined): number | null {
	if (trackId === undefined) return null;
	const current = queue.items.find(item => item.id === queue.currentItemId);
	return current && hashStringToNumber(current.track.trackUri) === trackId
		? current.track.durationMs
		: null;
}

export function useRemoteNowPlaying(): NowPlaying | null {
	const target = useConnectStore(state => state.target);
	const remoteStatus = useConnectStore(state => state.remoteStatus);
	const userId = useSession(session => session?.user?.id ?? null);
	const queue = useActiveQueue();
	function queueNext() {
		return useQueueStore.getState().next();
	}
	function queuePrevious() {
		return useQueueStore.getState().previous();
	}

	const isRemote = target.kind === 'remote';
	const remotePlaying = isRemote && (remoteStatus?.isPlaying ?? false);

	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		if (!remotePlaying) return;
		const timer = setInterval(() => setNow(Date.now()), REMOTE_TICK_MS);
		return () => clearInterval(timer);
	}, [remotePlaying]);

	if (target.kind !== 'remote') return null;
	const remoteTarget = target;

	const track = remoteStatus?.track ?? null;
	const durationMs = remoteDurationMs(queue, track?.id);
	const deviceName = remoteStatus?.device.deviceName ?? 'un autre appareil';
	const deviceLabel =
		target.ownerId !== userId && target.ownerUsername
			? `${deviceName} de ${target.ownerUsername}`
			: deviceName;

	function toggle() {
		if (!track) return;
		const socket = useSocketStore.getState().socket;
		if (!socket) return;
		useConnectStore.getState().setControlPending(true);
		socket.emit('control:action', {
			targetUserId: remoteTarget.ownerId,
			targetDeviceId: remoteTarget.deviceId,
			action: remotePlaying ? 'pause' : 'play',
		});
	}

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
		next: () => void queueNext(),
		previous: () => void queuePrevious(),
		hasNext: selectHasNext(queue),
		hasPrevious: selectHasPrevious(queue),
	};
}
