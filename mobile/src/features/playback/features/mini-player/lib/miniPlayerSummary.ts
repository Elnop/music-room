import { openPlayerLabel } from '@/features/playback/shared/player/lib/openPlayerLabel';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';
import type { MiniPlayerData } from '@/features/playback/features/mini-player/miniPlayerTypes';

type MiniPlayerSummary = Pick<
	MiniPlayerData,
	'track' | 'deviceLabel' | 'isPlaying' | 'isLoading' | 'playDisabled' | 'progress' | 'openLabel'
>;

export function miniPlayerSummary(nowPlaying: NowPlaying): MiniPlayerSummary {
	const { track, durationMs, positionMs, deviceLabel } = nowPlaying;
	return {
		track,
		deviceLabel,
		isPlaying: nowPlaying.isPlaying,
		isLoading: nowPlaying.isLoading,
		playDisabled: nowPlaying.isLoading || !track,
		progress: track && durationMs ? Math.min(100, (positionMs / durationMs) * 100) : 0,
		openLabel: openPlayerLabel(track, deviceLabel),
	};
}
