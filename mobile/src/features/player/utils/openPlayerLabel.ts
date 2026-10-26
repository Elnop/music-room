import type { NowPlayingTrack } from '@/features/player/types';

export function openPlayerLabel(track: NowPlayingTrack | null, deviceLabel: string | null): string {
	return [
		'Ouvrir le lecteur',
		...(track ? [track.title, track.artist] : ['Rien en lecture']),
		...(deviceLabel ? [`sur ${deviceLabel}`] : []),
	].join(', ');
}
