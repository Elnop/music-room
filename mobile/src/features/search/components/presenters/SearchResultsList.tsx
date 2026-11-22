import React from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { useContentColumn } from '@/shared/content-column/useContentColumn';
import { SoundCloudTrackItem } from '@/features/search/components/presenters/SoundCloudTrackItem';
import { SearchEmptyState } from '@/features/search/components/presenters/SearchEmptyState';
import type { SearchResults, SearchTrackHandlers } from '@/features/search/searchTypes';

type SearchResultsListProps = {
	results: SearchResults;
	searchQuery: string;
	trackHandlers: SearchTrackHandlers;
	bottomPadding: number;
};

export function SearchResultsList({
	results,
	searchQuery,
	trackHandlers,
	bottomPadding,
}: SearchResultsListProps) {
	const { theme } = useTheme();
	const column = useContentColumn();

	return (
		<FlatList
			data={results.tracks}
			refreshControl={searchRefreshControl(results, theme.colors.primary)}
			keyExtractor={(item) => item.id.toString()}
			renderItem={({ item }) => <SoundCloudTrackItem track={item} {...trackHandlers} />}
			contentContainerStyle={[styles.content, paddingBottomStyle(bottomPadding), column]}
			ListEmptyComponent={<SearchEmptyState results={results} searchQuery={searchQuery} />}
		/>
	);
}

function searchRefreshControl(results: SearchResults, color: string) {
	return (
		<RefreshControl
			refreshing={results.isRefreshing}
			onRefresh={results.onRefresh}
			tintColor={color}
			colors={[color]}
		/>
	);
}

function paddingBottomStyle(paddingBottom: number): ViewStyle {
	return { paddingBottom };
}

const styles = StyleSheet.create({
	content: { flexGrow: 1 },
});
