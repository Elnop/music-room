import type { SoundCloudTrack } from '@/types/soundcloud.types';

export function isPreviewOnly(track: Pick<SoundCloudTrack, 'policy' | 'media'>): boolean {
	if (track.policy === 'SNIP') return true;
	const transcodings = track.media?.transcodings;
	if (!transcodings || transcodings.length === 0) return false;
	return transcodings.every(t => t.snipped === true);
}
