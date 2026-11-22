import { getPlayerState } from '@/features/playback/shared/player/lib/getPlayerState';
import { queueStore } from '@/features/playback/shared/player/stores/queueStore';
import { connectStore } from '@/features/playback/shared/player/stores/connectStore';
import { selectQueue } from '@/features/playback/shared/player/lib/queueSelectors';
import { estimatePositionMs } from '@/features/playback/shared/player/lib/estimatePositionMs';
import { hashStringToNumber } from '@/features/playback/shared/player/lib/trackToSoundCloud';
import { toTrackInput } from '@/shared/tracks/lib/toTrackInput';
import type {
	ConnectTarget,
	RemoteTarget,
} from '@/features/playback/shared/player/types/queueTypes';
import type { QueueTrack } from '@/shared/playback/types/queueTypes';
import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import type { TransferPlayback } from '@/features/playback/features/control-delegation/features/device-picker/devicePickerTypes';

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

function localPlayback(): TransferPlayback | null {
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
	{ ownerId, deviceId }: RemoteTarget,
	me: string | null,
): TransferPlayback | null | 'untransferable' {
	const { remoteStatus } = connectStore.getState();
	if (!remoteStatus?.track) return null;
	const queue = selectQueue(queueStore.getState(), ownerId);
	const item = queue.items.find((entry) => entry.id === queue.currentItemId);
	if (!item || hashStringToNumber(item.track.trackUri) !== remoteStatus.track.id) {
		return 'untransferable';
	}
	return {
		playing: ownerId === me ? { queueItemId: item.id } : { track: fromQueueTrack(item.track) },
		positionMs: Math.max(0, Math.round(estimatePositionMs(remoteStatus, Date.now(), null))),
		source: { userId: ownerId, deviceId },
	};
}

export function currentPlayback(
	target: ConnectTarget,
	me: string | null,
): TransferPlayback | null | 'untransferable' {
	return target.kind === 'remote' ? remotePlayback(target, me) : localPlayback();
}
