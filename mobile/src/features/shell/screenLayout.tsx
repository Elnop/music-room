import React from 'react';
import { ScreenContent } from './ScreenContent';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { AlignedHeader } from '@/features/shell/components/presenters/AlignedHeader';
import {
	EDGE_SCROLL_SCREENS,
	FULL_BLEED_SCREENS,
	SCREEN_WIDTHS,
} from '@/features/shell/lib/screenWidths';

interface ScreenLayoutArgs {
	route: { name: string };
	children: React.ReactElement;
}

export const screenLayout =
	(besideSidebar: boolean) =>
	({ route, children }: ScreenLayoutArgs) => {
		const width = SCREEN_WIDTHS[route.name];
		if (!width || FULL_BLEED_SCREENS.has(route.name)) return children;
		return (
			<ScreenContent
				width={width}
				besideSidebar={besideSidebar}
				scrollsAtEdge={EDGE_SCROLL_SCREENS.has(route.name)}
			>
				{children}
			</ScreenContent>
		);
	};

export const screenHeader = (props: NativeStackHeaderProps) => <AlignedHeader {...props} />;
