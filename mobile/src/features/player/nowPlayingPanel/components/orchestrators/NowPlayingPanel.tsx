import React from 'react';
import { useNowPlayingPanel } from '@/features/player/nowPlayingPanel/hooks/useNowPlayingPanel';
import { NowPlayingPanelView } from '@/features/player/nowPlayingPanel/components/presenters/NowPlayingPanelView';

export function NowPlayingPanel() {
	const data = useNowPlayingPanel();
	return <NowPlayingPanelView data={data} />;
}
