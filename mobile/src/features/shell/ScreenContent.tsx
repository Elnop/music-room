import React from 'react';
import { ContentFrame } from '@/features/shell/components/presenters/ContentFrame';
import { usePanelOpen } from '@/features/shell/components/orchestrators/PanelOpenContainer';
import type { ContentWidth } from '@/shared/theme/lib/layout';

type ScreenContentProps = {
	width: ContentWidth;
	besideSidebar: boolean;
	scrollsAtEdge: boolean;
	children: React.ReactNode;
};

export function ScreenContent({
	width,
	besideSidebar,
	scrollsAtEdge,
	children,
}: ScreenContentProps) {
	const panelOpen = usePanelOpen();
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
