import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { SearchTracks } from '@/features/playlists/features/editor/features/search-tracks/searchTracksTypes';
import { AddableTrackRow } from '@/features/playlists/features/editor/features/search-tracks/components/presenters/AddableTrackRow';
import { SearchTracksEmpty } from '@/features/playlists/features/editor/features/search-tracks/components/presenters/SearchTracksEmpty';

type SearchTracksResultsProps = {
	screen: SearchTracks;
	bottomPadding: number;
};

const MemoizedTrackRow = React.memo(AddableTrackRow);

export function SearchTracksResults({ screen, bottomPadding }: SearchTracksResultsProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme, bottomPadding), [theme, bottomPadding]);
	const typed = screen.search.text.trim() !== '';

	return (
		<FlatList
			data={screen.results}
			keyExtractor={item => item.id.toString()}
			renderItem={({ item }) => (
				<MemoizedTrackRow
					track={item}
					isAdded={screen.isAdded(item)}
					onAdd={screen.add}
					onAddToQueue={screen.addToQueue}
					onShowActions={screen.showActions}
				/>
			)}
			contentContainerStyle={styles.list}
			showsVerticalScrollIndicator={false}
			ListEmptyComponent={typed && screen.isLoading ? null : <SearchTracksEmpty typed={typed} />}
		/>
	);
}

function createStyles(theme: Theme, bottomPadding: number) {
	const styles = StyleSheet.create({
		list: {
			flexGrow: 1,
			paddingTop: theme.spacing.sm,
			paddingBottom: bottomPadding,
		},
	});
	return styles;
}
