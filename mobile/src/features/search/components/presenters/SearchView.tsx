import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonList, TrackRowSkeleton } from '@/shared/theme/components/Skeleton';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { TrackActionsSheetComponent } from '@/shared/playback/types/trackActionsSheetTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useContentColumn } from '@/shared/content-column/useContentColumn';
import { SearchHeader } from '@/features/search/components/presenters/SearchHeader';
import { SearchResultsList } from '@/features/search/components/presenters/SearchResultsList';
import type { SearchScreen } from '@/features/search/searchTypes';

type SearchViewProps = SearchScreen & {
	TrackActionsSheet: TrackActionsSheetComponent;
};

export function SearchView({ TrackActionsSheet, field, results, ...screen }: SearchViewProps) {
	const { styles } = useThemedStyles(createStyles);
	const column = useContentColumn();
	const loading = results.isLoading && !results.isRefreshing;

	return (
		<View style={styles.container}>
			<SearchHeader field={field} loading={loading} />
			{loading && results.tracks.length === 0 ? (
				<SkeletonList count={8} row={TrackRowSkeleton} style={column} />
			) : (
				<SearchResultsList
					results={results}
					searchQuery={field.searchQuery}
					trackHandlers={screen.trackHandlers}
					bottomPadding={screen.bottomPadding}
				/>
			)}
			<TrackActionsSheet track={screen.actionSheet.track} onClose={screen.actionSheet.onClose} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
	});
	return styles;
}
