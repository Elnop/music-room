import React from 'react';
import { ScrollView } from 'react-native';
import { ThemedRefreshControl } from '@/shared/components/lists/ThemedRefreshControl';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createListStyles } from './listStyles';

interface RefreshableScrollProps {
	isRefreshing: boolean;
	onRefresh: () => void;
	/** Space left under the content for the mini player. */
	bottomPadding: number;
	children: React.ReactNode;
}

export function RefreshableScroll({
	isRefreshing,
	onRefresh,
	bottomPadding,
	children,
}: RefreshableScrollProps) {
	const { styles, theme } = useThemedStyles(createListStyles);

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={[styles.list, { paddingBottom: bottomPadding }]}
			refreshControl={
				<ThemedRefreshControl
					refreshing={isRefreshing}
					onRefresh={onRefresh}
					color={theme.colors.primary}
				/>
			}
			showsVerticalScrollIndicator={false}
		>
			{children}
		</ScrollView>
	);
}
