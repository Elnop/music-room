import { useNowPlayingPanelState } from '@/features/playback/shared/panel/useNowPlayingPanelState';
import { trackSummary } from '@/features/playback/shared/player/lib/openPlayerLabel';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';
import type { PlayerBarPanel } from '@/features/playback/features/player-bar/playerBarTypes';

export function usePlayerBarPanel(nowPlaying: NowPlaying): PlayerBarPanel {
	const isOpen = useNowPlayingPanelState(state => state.isOpen);
	const onToggle = useNowPlayingPanelState(state => state.toggle);
	const label = isOpen ? 'Masquer « En cours de lecture »' : 'Afficher « En cours de lecture »';
	const summary = trackSummary(nowPlaying.track, nowPlaying.deviceLabel);
	return { isOpen, label, trackLabel: [label, ...summary].join(', '), onToggle };
}
