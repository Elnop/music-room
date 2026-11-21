import React from 'react';
import { useNowPlayingPanel } from '@/features/playback/features/now-playing-panel/hooks/useNowPlayingPanel';
import { NowPlayingPanelView } from '@/features/playback/features/now-playing-panel/components/presenters/NowPlayingPanelView';
import type { PanelSheetComponents } from '@/features/playback/features/now-playing-panel/nowPlayingPanelTypes';

type NowPlayingPanelContainerProps = PanelSheetComponents;

export function NowPlayingPanelContainer(sheets: NowPlayingPanelContainerProps) {
	const data = useNowPlayingPanel();
	return <NowPlayingPanelView data={data} {...sheets} />;
}
