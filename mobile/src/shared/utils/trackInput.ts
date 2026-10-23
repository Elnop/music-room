import type { QueueTrack } from '@/types/queue.types';
import type { AddQueueItemBody } from '@/shared/types/playback';
import type { SoundCloudTrack } from '@/types/soundcloud.types';
import type { Track } from '@/types/track.types';

/** `previewUrl` is never sent: stream URLs expire. */
export function toTrackInput(track: SoundCloudTrack | Track | QueueTrack): AddQueueItemBody {
	if ('permalink_url' in track) {
		return {
			trackUri: track.permalink_url,
			title: track.title,
			artist: track.user.username,
			album: undefined,
			albumArt: track.artwork_url || track.user.avatar_url || undefined,
			durationMs: track.duration,
		};
	}
	return {
		trackUri: track.trackUri,
		title: track.title,
		artist: track.artist,
		album: track.album || undefined,
		albumArt: track.albumArt || undefined,
		durationMs: track.durationMs,
	};
}
