import type { NowPlayingTrack } from '@/features/player/types';

export function trackSummary(track: NowPlayingTrack | null, deviceLabel: string | null): string[] {
	return [
		...(track ? [track.title, track.artist] : ['Rien en lecture']),
		...(deviceLabel ? [`sur ${deviceLabel}`] : []),
	];
}

export function openPlayerLabel(track: NowPlayingTrack | null, deviceLabel: string | null): string {
	return ['Ouvrir le lecteur', ...trackSummary(track, deviceLabel)].join(', ');
}
