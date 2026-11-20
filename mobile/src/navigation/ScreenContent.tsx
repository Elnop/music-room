import React from 'react';
import { ContentFrame } from '@/shared/theme/components/ContentFrame';
import { useNowPlayingPanelStore } from '@/features/player/stores/nowPlayingPanelStore';
import type { ContentWidth } from '@/shared/theme/lib/layout';

interface ScreenContentProps {
	width: ContentWidth;
	besideSidebar: boolean;
	scrollsAtEdge: boolean;
	children: React.ReactNode;
}

export function ScreenContent({ width, besideSidebar, scrollsAtEdge, children }: ScreenContentProps) {
	const panelOpen = useNowPlayingPanelStore(state => state.isOpen);
	return (
		<ContentFrame
			width={width}
			besideSidebar={besideSidebar}
			scrollsAtEdge={scrollsAtEdge}
			panelOpen={panelOpen}
		>
			{children}
		</ContentFrame>
	);
}
