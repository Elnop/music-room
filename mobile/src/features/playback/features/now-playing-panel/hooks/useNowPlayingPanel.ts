import { queueStore } from '@/features/playback/shared/player/stores/queueStore';
import { useNowPlaying } from '@/features/playback/shared/player/hooks/useNowPlaying';
import { THIS_DEVICE_LABEL } from '@/shared/platform/platformConfig';
import { usePanelArtwork } from '@/features/playback/features/now-playing-panel/hooks/usePanelArtwork';
import { usePanelNavigation } from '@/features/playback/features/now-playing-panel/hooks/usePanelNavigation';
import { usePanelTrackActions } from '@/features/playback/features/now-playing-panel/hooks/usePanelTrackActions';
import { usePanelUpNext } from '@/features/playback/features/now-playing-panel/hooks/usePanelUpNext';
import type { NowPlayingPanelData } from '@/features/playback/features/now-playing-panel/nowPlayingPanelTypes';

export function useNowPlayingPanel(): NowPlayingPanelData {
	const navigation = usePanelNavigation();
	const nowPlaying = useNowPlaying();
	const next = usePanelUpNext(nowPlaying.isRemote);
	const artwork = usePanelArtwork(nowPlaying.track);
	const trackActions = usePanelTrackActions(next.source);
	return {
		...navigation,
		...artwork,
		...trackActions,
		track: nowPlaying.track,
		deviceLabel: nowPlaying.deviceLabel ?? THIS_DEVICE_LABEL,
		isRemote: nowPlaying.isRemote,
		upNext: next.items,
		upNextTotal: next.total,
		onPlayItem: (itemId) => {
			void queueStore.getState().playItem(itemId);
		},
	};
}
