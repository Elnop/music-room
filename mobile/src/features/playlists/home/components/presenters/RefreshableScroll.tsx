import React from 'react';
import { ScrollView } from 'react-native';
import { useContentColumn } from '@/shared/hooks/useContentColumn';
import { ThemedRefreshControl } from '@/shared/components/lists/ThemedRefreshControl';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createListStyles } from './listStyles';

interface RefreshableScrollProps {
	isRefreshing: boolean;
	onRefresh: () => void;
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
	const column = useContentColumn();

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={[styles.list, { paddingBottom: bottomPadding }, column]}
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
