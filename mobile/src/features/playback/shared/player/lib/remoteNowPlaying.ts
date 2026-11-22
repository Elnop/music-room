import { socketStore } from '@/shared/backend/socketStore';
import { estimatePositionMs } from '@/features/playback/shared/player/lib/estimatePositionMs';
import {
	selectHasNext,
	selectHasPrevious,
} from '@/features/playback/shared/player/lib/queueNavigation';
import { hashStringToNumber } from '@/features/playback/shared/player/lib/trackToSoundCloud';
import { connectStore } from '@/features/playback/shared/player/stores/connectStore';
import { queueStore } from '@/features/playback/shared/player/stores/queueStore';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';
import type {
	ListeningStatus,
	OwnerQueue,
	RemoteTarget,
} from '@/features/playback/shared/player/types/queueTypes';

type RemoteView = {
	target: RemoteTarget;
	status: ListeningStatus | null;
	queue: OwnerQueue;
	now: number;
	userId: string | null;
};

function remoteDurationMs(queue: OwnerQueue, trackId: number | undefined): number | null {
	if (trackId === undefined) return null;
	const current = queue.items.find((item) => item.id === queue.currentItemId);
	return current && hashStringToNumber(current.track.trackUri) === trackId
		? current.track.durationMs
		: null;
}

function remoteDeviceLabel(view: RemoteView): string {
	const deviceName = view.status?.device.deviceName ?? 'un autre appareil';
	return view.target.ownerId !== view.userId && view.target.ownerUsername
		? `${deviceName} de ${view.target.ownerUsername}`
		: deviceName;
}

function toggleRemote(target: RemoteTarget, playing: boolean): void {
	const socket = socketStore.getState().socket;
	if (!socket) return;
	connectStore.getState().setControlPending(true);
	socket.emit('control:action', {
		targetUserId: target.ownerId,
		targetDeviceId: target.deviceId,
		action: playing ? 'pause' : 'play',
	});
}

export function remoteNowPlaying(view: RemoteView): NowPlaying {
	const track = view.status?.track ?? null;
	const durationMs = remoteDurationMs(view.queue, track?.id);
	const isPlaying = view.status?.isPlaying ?? false;
	return {
		isRemote: true,
		track,
		isPlaying,
		isLoading: false,
		canToggle: track !== null,
		positionMs: view.status ? estimatePositionMs(view.status, view.now, durationMs) : 0,
		durationMs,
		deviceLabel: remoteDeviceLabel(view),
		toggle: () => {
			if (track) toggleRemote(view.target, isPlaying);
		},
		next: () => void queueStore.getState().next(),
		previous: () => void queueStore.getState().previous(),
		hasNext: selectHasNext(view.queue),
		hasPrevious: selectHasPrevious(view.queue),
	};
}
