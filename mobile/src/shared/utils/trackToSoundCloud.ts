import type { Track } from '@/types/track.types';
import type { QueueItem, QueueTrack } from '@/types/queue.types';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

export const hashStringToNumber = (str: string): number => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const chr = str.charCodeAt(i);
		hash = (hash << 5) - hash + chr;
		hash |= 0;
	}
	return Math.abs(hash);
};

interface PlayableFields {
	id: number;
	title: string;
	artist: string;
	durationMs: number;
	trackUri: string;
	albumArt: string | null;
}

const build = ({ id, title, artist, durationMs, trackUri, albumArt }: PlayableFields) => ({
	id,
	title,
	description: null,
	duration: durationMs,
	genre: null,
	artwork_url: albumArt,
	permalink_url: trackUri,
	user: {
		id,
		username: artist,
		avatar_url: albumArt,
		permalink_url: trackUri,
	},
	playable: true,
});

/** A queue track (a queue item's, or a `play-track` command's) as the player's track. */
export function queueTrackToSoundCloud(track: QueueTrack): SoundCloudTrack {
	return build({
		id: hashStringToNumber(track.trackUri),
		title: track.title,
		artist: track.artist,
		durationMs: track.durationMs,
		trackUri: track.trackUri,
		albumArt: track.albumArt,
	});
}

/** The stream URL is fetched later from `permalink_url`. */
export function trackToSoundCloud(track: Track): SoundCloudTrack;
export function trackToSoundCloud(item: QueueItem): SoundCloudTrack;
export function trackToSoundCloud(input: Track | QueueItem): SoundCloudTrack {
	if ('track' in input) return queueTrackToSoundCloud(input.track);
	const parsed = parseInt(input.id, 10);
	const id = !Number.isNaN(parsed) ? parsed : hashStringToNumber(input.trackUri || input.id);
	return build({
		id,
		title: input.title,
		artist: input.artist,
		durationMs: input.durationMs,
		trackUri: input.trackUri,
		albumArt: input.albumArt || null,
	});
}
