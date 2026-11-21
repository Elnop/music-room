import type { NowPlayingTrack } from '@/features/playback/shared/player/types/playerTypes';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';

export function toNowPlayingTrack(track: SoundCloudTrack | null): NowPlayingTrack | null {
	if (!track) return null;
	return {
		id: track.id,
		title: track.title,
		artist: track.user.username,
		artworkUrl: track.artwork_url || track.user.avatar_url || null,
	};
}
