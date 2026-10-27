import React from 'react';
import { useNowPlayingPanel } from '@/features/player/nowPlayingPanel/hooks/useNowPlayingPanel';
import { NowPlayingPanelView } from '@/features/player/nowPlayingPanel/components/presenters/NowPlayingPanelView';

/** Mounted while the desktop's panel is open: mounting moves the keyboard focus into it. */
export function NowPlayingPanel() {
	const data = useNowPlayingPanel();
	return <NowPlayingPanelView data={data} />;
}
