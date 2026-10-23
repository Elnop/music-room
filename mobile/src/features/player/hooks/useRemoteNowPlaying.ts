import { useEffect, useState } from 'react';
import { useConnectStoreSelector, setControlPending } from '@/shared/services/connectBridge';
import { useSession } from '@/shared/services/authSession';
import { useSocketStore } from '@/shared/stores/socketStore';
import { useActiveQueue, getPlayback, type OwnerQueue } from '@/shared/services/playbackBridge';
import { selectHasNext, selectHasPrevious } from '@/shared/utils/queueNavigation';
import { hashStringToNumber } from '@/shared/utils/trackToSoundCloud';
import { estimatePositionMs } from '@/shared/utils/remotePosition';
import type { NowPlaying } from '@/features/player/types';

const REMOTE_TICK_MS = 1000;

function remoteDurationMs(queue: OwnerQueue, trackId: number | undefined): number | null {
	if (trackId === undefined) return null;
	const current = queue.items.find(item => item.id === queue.currentItemId);
	return current && hashStringToNumber(current.track.trackUri) === trackId
		? current.track.durationMs
		: null;
}

export function useRemoteNowPlaying(): NowPlaying | null {
	const target = useConnectStoreSelector(state => state.target);
	const remoteStatus = useConnectStoreSelector(state => state.remoteStatus);
	const userId = useSession(session => session?.user?.id ?? null);
	const queue = useActiveQueue();
	const queueNext = () => getPlayback().next();
	const queuePrevious = () => getPlayback().previous();

	const isRemote = target.kind === 'remote';
	const remotePlaying = isRemote && (remoteStatus?.isPlaying ?? false);

	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		if (!remotePlaying) return;
		const timer = setInterval(() => setNow(Date.now()), REMOTE_TICK_MS);
		return () => clearInterval(timer);
	}, [remotePlaying]);

	if (target.kind !== 'remote') return null;

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
		setControlPending(true);
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
		next: () => void queueNext(),
		previous: () => void queuePrevious(),
		hasNext: selectHasNext(queue),
		hasPrevious: selectHasPrevious(queue),
	};
}
