import type { SoundCloudTrack } from '@/types/soundcloud.types';

/**
 * Whether SoundCloud only serves a 30-second preview of the track (SoundCloud Go),
 * read from its own fields: `policy: 'SNIP'`, or every transcoding `snipped`.
 * A track without these fields is never flagged.
 */
export function isPreviewOnly(track: Pick<SoundCloudTrack, 'policy' | 'media'>): boolean {
	if (track.policy === 'SNIP') return true;
	const transcodings = track.media?.transcodings;
	if (!transcodings || transcodings.length === 0) return false;
	return transcodings.every(t => t.snipped === true);
}
