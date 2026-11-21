import type { QueueTrack } from '@/shared/playback/lib/queue.types';
import type { AddQueueItemBody } from '@/shared/playback/lib/playback';
import type { SoundCloudTrack } from './soundcloud.types';
import type { Track } from './track.types';

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
