import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CONTENT_MAX_WIDTH, SIDEBAR_WIDTH, type ContentWidth } from '@/shared/constants/layout';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { ContentWidthContext } from '@/shared/hooks/useContentWidth';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Theme } from '@/shared/theme/types';

interface ContentContainerProps {
	width: ContentWidth;
	/** The left navigation takes its share of the window: the app's screens, not the auth ones. */
	besideSidebar?: boolean;
	children: React.ReactNode;
}

/** Centres a screen at a maximum width on wide screens; on the phone it renders nothing of its own. */
export function ContentContainer({
	width,
	besideSidebar = false,
	children,
}: ContentContainerProps) {
	const { styles } = useThemedStyles(createStyles);
	const { breakpoint, isWide, width: windowWidth } = useBreakpoint();

	if (!isWide) return <>{children}</>;

	const sidebar = besideSidebar && breakpoint !== 'phone' ? SIDEBAR_WIDTH[breakpoint] : 0;
	const contentWidth = Math.min(windowWidth - sidebar, CONTENT_MAX_WIDTH[width]);

	return (
		<ContentWidthContext.Provider value={contentWidth}>
			<View style={styles.outer}>
				<View style={[styles.inner, { maxWidth: CONTENT_MAX_WIDTH[width] }]}>{children}</View>
			</View>
		</ContentWidthContext.Provider>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		outer: { flex: 1, alignItems: 'center', backgroundColor: theme.colors.background },
		inner: { flex: 1, width: '100%' },
	});
