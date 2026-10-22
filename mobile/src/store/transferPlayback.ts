import { queueApi } from '@/services/queueApi';
import { deviceService } from '@/services/deviceService';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useConnectStore } from './connectStore';
import { readPositionMs, usePlayerStore } from './playerStore';
import { useQueueStore } from './queueStore';
import { selectQueue } from './queueSelectors';
import { estimatePositionMs } from '@/utils/remotePosition';
import { toTrackInput } from '@/shared/utils/trackInput';
import { hashStringToNumber } from '@/shared/utils/trackToSoundCloud';
import { showError } from '@/shared/utils/toast';
import { hapticSuccess } from '@/shared/utils/haptics';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import type { DevicePickerOwner } from '@/types/device.types';
import type { AddQueueItemBody, QueueTrack, TransferRequest } from '@/types/queue.types';
import { logger } from '@/shared/utils/logger';

/** What plays now and where it is, as the transfer route takes it; null when nothing plays. */
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

/** The phone's own audio: its queue item, else the track tapped in a list. */
function localPlayback(): Playback | null {
	const { currentTrack, queueItemId } = usePlayerStore.getState();
	if (!currentTrack) return null;
	return {
		playing: queueItemId ? { queueItemId } : { track: toTrackInput(currentTrack) },
		positionMs: Math.max(0, Math.round(readPositionMs() ?? 0)),
	};
}

/**
 * The remote device's current queue item: as an item of my queue on my own
 * device, as a track on a friend's (the route takes only my queue's items).
 */
function remotePlayback(
	ownerId: string,
	deviceId: string,
	me: string | null
): Playback | null | 'untransferable' {
	const { remoteStatus } = useConnectStore.getState();
	if (!remoteStatus?.track) return null;
	const queue = selectQueue(useQueueStore.getState(), ownerId);
	const item = queue.items.find(entry => entry.id === queue.currentItemId);
	// After a `play-track` the queue's current item is not what the device plays.
	if (!item || hashStringToNumber(item.track.trackUri) !== remoteStatus.track.id) {
		return 'untransferable';
	}
	return {
		playing: ownerId === me ? { queueItemId: item.id } : { track: fromQueueTrack(item.track) },
		positionMs: Math.max(0, Math.round(estimatePositionMs(remoteStatus, Date.now(), null))),
		source: { userId: ownerId, deviceId },
	};
}

/**
 * Play on `deviceId` of `owner` (#298, Spotify Connect style): what plays
 * moves there at its position through `POST /api/queue/transfer`, and the
 * player targets that device (or this phone, which then resumes on the
 * server's `play-item` / `play-track`). With nothing playing, only the target
 * changes. On failure a toast shows and neither the audio nor the target
 * changes. Resolves true when the target is (now) the chosen device.
 */
export async function transferTo(owner: DevicePickerOwner, deviceId: string): Promise<boolean> {
	const me = useAuthStore.getState().user?.id ?? null;
	const { target } = useConnectStore.getState();
	const phoneId = (await deviceService.getDeviceInfo()).deviceId;
	const toPhone = owner.isSelf && deviceId === phoneId;

	// The active device: nothing to do.
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
			// In local mode `setRemote` stops the phone itself.
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
