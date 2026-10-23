import type { SoundCloudTrack } from '@/types/soundcloud.types';

/** SoundCloud Go preview: `policy: 'SNIP'` or every transcoding `snipped`; a track without these fields is never flagged. */
export function isPreviewOnly(track: Pick<SoundCloudTrack, 'policy' | 'media'>): boolean {
	if (track.policy === 'SNIP') return true;
	const transcodings = track.media?.transcodings;
	if (!transcodings || transcodings.length === 0) return false;
	return transcodings.every(t => t.snipped === true);
}
