import { usePlayerBarPanel } from '@/features/playback/features/player-bar/hooks/usePlayerBarPanel';
import { usePlayerBarPlayback } from '@/features/playback/features/player-bar/hooks/usePlayerBarPlayback';
import { usePlayerBarSheets } from '@/features/playback/features/player-bar/hooks/usePlayerBarSheets';
import { usePlayerBarVolume } from '@/features/playback/features/player-bar/hooks/usePlayerBarVolume';
import type { PlayerBarData } from '@/features/playback/features/player-bar/playerBarTypes';

export function usePlayerBar(): PlayerBarData {
	const playback = usePlayerBarPlayback();
	const panel = usePlayerBarPanel(playback.nowPlaying);
	const volume = usePlayerBarVolume(playback.nowPlaying.isRemote);
	const sheets = usePlayerBarSheets();
	return { ...playback, panel, volume, sheets };
}
