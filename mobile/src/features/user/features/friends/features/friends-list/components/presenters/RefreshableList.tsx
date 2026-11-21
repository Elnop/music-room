import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import type { FlatListProps, ViewStyle } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { ThemedRefreshControl } from '@/shared/refresh-control/ThemedRefreshControl';
import { useContentColumn } from '@/shared/content-column/useContentColumn';
import type { ListRefresh } from '@/features/user/features/friends/features/friends-list/friendsListTypes';

type RefreshableListProps<T> = Omit<
	FlatListProps<T>,
	'refreshControl' | 'contentContainerStyle'
> & {
	refresh: ListRefresh;
	bottomPadding: number;
};

export function RefreshableList<T>({
	refresh,
	bottomPadding,
	...listProps
}: RefreshableListProps<T>) {
	const { theme, styles } = useThemedStyles(createStyles);
	const column = useContentColumn();

	return (
		<FlatList
			{...listProps}
			columnWrapperStyle={(listProps.numColumns ?? 1) > 1 ? styles.gridRow : undefined}
			refreshControl={
				<ThemedRefreshControl
					refreshing={refresh.isRefreshing}
					onRefresh={refresh.onRefresh}
					color={theme.colors.primary}
				/>
			}
			contentContainerStyle={[styles.listContent, bottomPaddingStyle(bottomPadding), column]}
		/>
	);
}

function bottomPaddingStyle(bottomPadding: number): ViewStyle {
	return { paddingBottom: bottomPadding };
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		listContent: {
			paddingBottom: theme.spacing.xl,
		},
		gridRow: {
			gap: theme.spacing.sm,
			paddingHorizontal: theme.spacing.sm,
		},
	});
	return styles;
}
