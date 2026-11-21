import React from 'react';
import type { TrackActionsSheetComponent } from '@/shared/playback/lib/trackActionsSheet';
import type { PlayerSheets } from '@/features/playback/shared/full-screen-sheet/FullScreenSheet';
import { useNowPlayingPanel } from '@/features/playback/features/now-playing-panel/hooks/useNowPlayingPanel';
import { NowPlayingPanelView } from '@/features/playback/features/now-playing-panel/components/presenters/NowPlayingPanelView';

export function NowPlayingPanelContainer(
	sheets: PlayerSheets & { TrackActionsSheet: TrackActionsSheetComponent }
) {
	const data = useNowPlayingPanel();
	return <NowPlayingPanelView data={data} {...sheets} />;
}
