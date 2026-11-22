import { lastTrackStorage } from '@/shared/playback/lastTrackStorage';
import type { LastTrackEntry } from '@/shared/playback/types/playbackTypes';
import { toTrackInput } from '@/shared/tracks/lib/toTrackInput';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import { logger } from '@/shared/logging/logger';
import { isLocalTarget } from '@/features/playback/lib/isLocalTarget';
import { readPositionMs } from '@/features/playback/shared/player/lib/positionReader';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import type { PlayerState } from '@/features/playback/shared/player/types/playerStateTypes';

function savedPositionMs(state: PlayerState): number {
	const position =
		state.needsStreamLoad || state.playbackState === 'loading'
			? state.startPositionMs
			: (readPositionMs() ?? state.startPositionMs);
	return position !== null && Number.isFinite(position) ? Math.max(0, Math.round(position)) : 0;
}

function toEntryTrack(track: SoundCloudTrack): LastTrackEntry['track'] {
	const input = toTrackInput(track);
	return {
		trackUri: input.trackUri,
		title: input.title,
		artist: input.artist,
		album: input.album ?? null,
		albumArt: input.albumArt ?? null,
		durationMs: input.durationMs,
	};
}

function snapshot(): LastTrackEntry | null {
	const state = playerStore.getState();
	if (!state.currentTrack) return null;
	return {
		track: toEntryTrack(state.currentTrack),
		queueItemId: state.queueItemId,
		positionMs: savedPositionMs(state),
	};
}

export function persistLastTrack(userId: string): void {
	if (!isLocalTarget()) return;
	const entry = snapshot();
	const write = entry ? lastTrackStorage.save(userId, entry) : lastTrackStorage.clear(userId);
	void write.catch(error => logger.warn('[lastTrackStorage] Save failed', error));
}
