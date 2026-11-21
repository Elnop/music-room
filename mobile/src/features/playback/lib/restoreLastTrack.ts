import type { LastTrackEntry } from '@/shared/playback/types/playbackTypes';
import { isLocalTarget } from '@/features/playback/shared/player/lib/connectTarget';
import { queueTrackToSoundCloud } from '@/features/playback/shared/player/lib/trackToSoundCloud';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';

export function restoreLastTrack(entry: LastTrackEntry | null): void {
	const player = playerStore.getState();
	if (!entry || player.currentTrack || !isLocalTarget()) return;
	player.restoreTrack(queueTrackToSoundCloud(entry.track), entry.queueItemId, entry.positionMs);
}
