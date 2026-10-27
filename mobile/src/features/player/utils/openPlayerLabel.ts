import type { NowPlayingTrack } from '@/features/player/types';

/** What a screen reader hears of the track on the button that opens the player. */
export function trackSummary(track: NowPlayingTrack | null, deviceLabel: string | null): string[] {
	return [
		...(track ? [track.title, track.artist] : ['Rien en lecture']),
		...(deviceLabel ? [`sur ${deviceLabel}`] : []),
	];
}

export function openPlayerLabel(track: NowPlayingTrack | null, deviceLabel: string | null): string {
	return ['Ouvrir le lecteur', ...trackSummary(track, deviceLabel)].join(', ');
}
