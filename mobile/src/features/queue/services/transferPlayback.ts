import { queueApi } from '@/features/queue/services/queueApi';
import { deviceService } from '@/services/deviceService';
import { getSession } from '@/shared/services/authSession';
import { useConnectStore } from '@/features/queue/stores/connectStore';
import { getPlayback } from '@/shared/services/playbackBridge';
import { useQueueStore } from '@/features/queue/stores/queueStore';
import { selectQueue } from '@/features/queue/utils/queueSelectors';
import { estimatePositionMs } from '@/shared/utils/remotePosition';
import { toTrackInput } from '@/shared/utils/trackInput';
import { hashStringToNumber } from '@/shared/utils/trackToSoundCloud';
import { showError } from '@/shared/utils/toast';
import { hapticSuccess } from '@/shared/utils/haptics';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import type { DevicePickerOwner } from '@/types/device.types';
import type { QueueTrack, TransferRequest } from '@/types/queue.types';
import type { AddQueueItemBody } from '@/shared/types/playback';
import { logger } from '@/shared/utils/logger';

interface Playback {
	playing: TransferRequest['playing'];
	positionMs: number;
	source?: TransferRequest['source'];
}

const fromQueueTrack = (track: QueueTrack): AddQueueItemBody => ({
	trackUri: track.trackUri,
	title: track.title,
	artist: track.artist,
	album: track.album ?? undefined,
	albumArt: track.albumArt ?? undefined,
	durationMs: track.durationMs,
});

function localPlayback(): Playback | null {
	const player = getPlayback().getPlayerState();
	if (!player.currentTrack) return null;
	return {
		playing: player.queueItemId
			? { queueItemId: player.queueItemId }
			: { track: toTrackInput(player.currentTrack) },
		positionMs: Math.max(0, Math.round(player.positionMs)),
	};
}

function remotePlayback(
	ownerId: string,
	deviceId: string,
	me: string | null
): Playback | null | 'untransferable' {
	const { remoteStatus } = useConnectStore.getState();
	if (!remoteStatus?.track) return null;
	const queue = selectQueue(useQueueStore.getState(), ownerId);
	const item = queue.items.find(entry => entry.id === queue.currentItemId);
	if (!item || hashStringToNumber(item.track.trackUri) !== remoteStatus.track.id) {
		return 'untransferable';
	}
	return {
		playing: ownerId === me ? { queueItemId: item.id } : { track: fromQueueTrack(item.track) },
		positionMs: Math.max(0, Math.round(estimatePositionMs(remoteStatus, Date.now(), null))),
		source: { userId: ownerId, deviceId },
	};
}

export async function transferTo(owner: DevicePickerOwner, deviceId: string): Promise<boolean> {
	const me = getSession().user?.id ?? null;
	const { target } = useConnectStore.getState();
	const phoneId = (await deviceService.getDeviceInfo()).deviceId;
	const toPhone = owner.isSelf && deviceId === phoneId;

	if (toPhone && target.kind === 'local') return true;
	if (
		target.kind === 'remote' &&
		target.ownerId === owner.ownerId &&
		target.deviceId === deviceId
	) {
		return true;
	}

	const switchTarget = () => {
		if (toPhone) {
			useConnectStore.getState().setLocal();
		} else {
			useConnectStore.getState().setRemote({
				ownerId: owner.ownerId,
				deviceId,
				ownerUsername: owner.username,
			});
		}
	};

	const playback =
		target.kind === 'remote'
			? remotePlayback(target.ownerId, target.deviceId, me)
			: localPlayback();
	if (!playback) {
		switchTarget();
		hapticSuccess();
		return true;
	}
	if (playback === 'untransferable') {
		showError('Ce titre ne peut pas être transféré');
		return false;
	}

	try {
		const result = await queueApi.transfer({
			targetUserId: owner.ownerId,
			targetDeviceId: deviceId,
			positionMs: playback.positionMs,
			playing: playback.playing,
			...(playback.source ? { source: playback.source } : {}),
		});
		switchTarget();
		hapticSuccess();
		if (result.queue) useQueueStore.getState().applyState(result.queue);
		return true;
	} catch (error) {
		logger.error('[transferPlayback] Transfer failed:', error);
		showError(apiErrorMessage(error, 'Impossible de transférer la lecture'));
		return false;
	}
}
