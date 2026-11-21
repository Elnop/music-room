import { queueApi } from '@/features/playback/shared/player/lib/queueApi';
import { deviceService } from '@/shared/backend/deviceService';
import { getSession } from '@/shared/backend/lib/authSession';
import { useConnectStore } from '@/features/playback/shared/player/stores/connectStore';
import { useQueueStore } from '@/features/playback/shared/player/stores/queueStore';
import { selectQueue } from '@/features/playback/shared/player/lib/queueSelectors';
import { estimatePositionMs } from '@/features/playback/shared/player/lib/remotePosition';
import { toTrackInput } from '@/shared/tracks/lib/toTrackInput';
import { hashStringToNumber } from '@/features/playback/shared/player/lib/trackToSoundCloud';
import { showError } from '@/shared/theme/lib/toast';
import { hapticSuccess } from '@/shared/theme/lib/haptics';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import type { DevicePickerOwner } from '@/features/playback/features/control-delegation/shared/delegation/lib/device.types';
import type { QueueTrack, TransferRequest } from '@/shared/playback/types/queueTypes';
import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import { logger } from '@/shared/logging/logger';
import { getPlayerState } from '@/features/playback/shared/player/stores/playerStore';

type Playback = {
	playing: TransferRequest['playing'];
	positionMs: number;
	source?: TransferRequest['source'];
};

function fromQueueTrack(track: QueueTrack): AddQueueItemBody {
	return {
		trackUri: track.trackUri,
		title: track.title,
		artist: track.artist,
		album: track.album ?? undefined,
		albumArt: track.albumArt ?? undefined,
		durationMs: track.durationMs,
	};
}

function localPlayback(): Playback | null {
	const player = getPlayerState();
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

	function switchTarget() {
		if (toPhone) {
			useConnectStore.getState().setLocal();
		} else {
			useConnectStore.getState().setRemote({
				ownerId: owner.ownerId,
				deviceId,
				ownerUsername: owner.username,
			});
		}
	}

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
