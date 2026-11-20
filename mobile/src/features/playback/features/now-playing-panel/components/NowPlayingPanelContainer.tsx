import React from 'react';
import type { PlayerSheets } from '@/features/playback/shared/full-screen-sheet/FullScreenSheet';
import { useNowPlayingPanel } from '@/features/playback/features/now-playing-panel/hooks/useNowPlayingPanel';
import { NowPlayingPanelView } from '@/features/playback/features/now-playing-panel/components/presenters/NowPlayingPanelView';

/** Mounted while the desktop's panel is open: mounting moves the keyboard focus into it. */
export function NowPlayingPanelContainer(sheets: PlayerSheets) {
	const data = useNowPlayingPanel();
	return <NowPlayingPanelView data={data} {...sheets} />;
}
