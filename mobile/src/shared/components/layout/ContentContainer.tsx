import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
	CONTENT_MAX_WIDTH,
	NOW_PLAYING_PANEL_WIDTH,
	SIDEBAR_WIDTH,
	type ContentWidth,
} from '@/shared/constants/layout';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { ContentColumnContext } from '@/shared/hooks/useContentColumn';
import { ContentWidthContext } from '@/shared/hooks/useContentWidth';
import { useNowPlayingPanelStore } from '@/shared/stores/nowPlayingPanelStore';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Theme } from '@/shared/theme/types';

interface ContentContainerProps {
	width: ContentWidth;
	/** App screens, not auth ones: the side bar and the now playing panel take their share of the window. */
	besideSidebar?: boolean;
	/** The screen centres its own content with useContentColumn. */
	scrollsAtEdge?: boolean;
	children: React.ReactNode;
}

export function ContentContainer({
	width,
	besideSidebar = false,
	scrollsAtEdge = false,
	children,
}: ContentContainerProps) {
	const { styles } = useThemedStyles(createStyles);
	const { breakpoint, isWide, isDesktop, width: windowWidth } = useBreakpoint();
	const panelOpen = useNowPlayingPanelStore(state => state.isOpen);

	if (!isWide) return <>{children}</>;

	const sidebar = besideSidebar && breakpoint !== 'phone' ? SIDEBAR_WIDTH[breakpoint] : 0;
	const panel = besideSidebar && isDesktop && panelOpen ? NOW_PLAYING_PANEL_WIDTH : 0;
	const contentWidth = Math.min(windowWidth - sidebar - panel, CONTENT_MAX_WIDTH[width]);

	return (
		<ContentWidthContext.Provider value={contentWidth}>
			<ContentColumnContext.Provider value={scrollsAtEdge ? CONTENT_MAX_WIDTH[width] : null}>
				<View style={styles.outer}>
					<View style={[styles.inner, !scrollsAtEdge && { maxWidth: CONTENT_MAX_WIDTH[width] }]}>
						{children}
					</View>
				</View>
			</ContentColumnContext.Provider>
		</ContentWidthContext.Provider>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		outer: { flex: 1, alignItems: 'center', backgroundColor: theme.colors.background },
		inner: { flex: 1, width: '100%' },
	});
