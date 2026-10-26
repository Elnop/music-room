import React from 'react';
import { ContentContainer } from '@/shared/components/layout/ContentContainer';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { AlignedHeader } from '@/navigation/AlignedHeader';
import { FULL_BLEED_SCREENS, SCREEN_WIDTHS } from '@/navigation/screenWidths';

interface ScreenLayoutArgs {
	route: { name: string };
	children: React.ReactElement;
}

/** A navigator's `screenLayout`: centres each screen at its width on wide screens. */
export const screenLayout =
	(besideSidebar: boolean) =>
	({ route, children }: ScreenLayoutArgs) => {
		const width = SCREEN_WIDTHS[route.name];
		if (!width || FULL_BLEED_SCREENS.has(route.name)) return children;
		return (
			<ContentContainer width={width} besideSidebar={besideSidebar}>
				{children}
			</ContentContainer>
		);
	};

/** A navigator's `header` on wide screens: the phone keeps the native one. */
export const screenHeader = (props: NativeStackHeaderProps) => <AlignedHeader {...props} />;
