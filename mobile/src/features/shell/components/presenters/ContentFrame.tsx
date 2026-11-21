import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { CONTENT_MAX_WIDTH } from '@/shared/theme/configs/layoutConfig';
import type { ContentWidth } from '@/shared/theme/types/layoutTypes';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { ContentColumnContext } from '@/shared/content-column/contentColumnConfig';
import { ContentWidthContext } from '@/shared/theme/configs/contentWidthConfig';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { frameContentWidth } from '@/features/shell/lib/frameContentWidth';

type ContentFrameProps = {
	width: ContentWidth;
	besideSidebar?: boolean;
	scrollsAtEdge?: boolean;
	panelOpen?: boolean;
	children: React.ReactNode;
};

export function ContentFrame({
	width,
	besideSidebar = false,
	scrollsAtEdge = false,
	panelOpen = false,
	children,
}: ContentFrameProps) {
	const { styles } = useThemedStyles(createStyles);
	const screen = useBreakpoint();

	if (!screen.isWide) return <>{children}</>;

	const maxWidth = CONTENT_MAX_WIDTH[width];
	const contentWidth = frameContentWidth(screen, { maxWidth, besideSidebar, panelOpen });

	return (
		<ContentWidthContext.Provider value={contentWidth}>
			<ContentColumnContext.Provider value={scrollsAtEdge ? maxWidth : null}>
				<View style={styles.outer}>
					<View style={[styles.inner, !scrollsAtEdge && maxWidthStyle(maxWidth)]}>{children}</View>
				</View>
			</ContentColumnContext.Provider>
		</ContentWidthContext.Provider>
	);
}

function maxWidthStyle(maxWidth: number): ViewStyle {
	return { maxWidth };
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		outer: { flex: 1, alignItems: 'center', backgroundColor: theme.colors.background },
		inner: { flex: 1, width: '100%' },
	});
	return styles;
}
