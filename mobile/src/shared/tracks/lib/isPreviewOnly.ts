import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';

export function isPreviewOnly(track: Pick<SoundCloudTrack, 'policy' | 'media'>): boolean {
	if (track.policy === 'SNIP') return true;
	const transcodings = track.media?.transcodings;
	if (!transcodings || transcodings.length === 0) return false;
	return transcodings.every((t) => t.snipped === true);
}
