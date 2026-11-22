import { RENEWAL_HEALTHY_MS } from '@/features/playback/shared/player/configs/playerConfig';
import { isLocalTarget } from '@/features/playback/lib/isLocalTarget';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import type { StreamWatch } from '@/features/playback/types/playbackEngineTypes';

type HealthySample = {
	statusId: number;
	positionMs: number;
	isPlaying: boolean;
};

export function noteHealthyPosition(watch: StreamWatch, sample: HealthySample): void {
	watch.loadedId = sample.statusId;
	watch.lastPositionMs = sample.positionMs;
	const { streamRenewed, startPositionMs } = playerStore.getState();
	const healthy = sample.positionMs >= (startPositionMs ?? 0) + RENEWAL_HEALTHY_MS;
	if (sample.isPlaying && streamRenewed && healthy) {
		playerStore.setState({ streamRenewed: false });
	}
}

export function recoverFailedStream(
	watch: StreamWatch,
	statusId: number,
	isPlaying: boolean
): void {
	if (!isPlaying || watch.loadedId !== statusId) return;
	if (watch.handledId === statusId || !isLocalTarget()) return;
	watch.handledId = statusId;
	const { streamRenewed, renewStream, setTrackUnavailableError } = playerStore.getState();
	if (streamRenewed) {
		setTrackUnavailableError('Impossible de charger ce titre');
	} else {
		renewStream(watch.lastPositionMs, true, true);
	}
}
