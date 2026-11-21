import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SearchBar } from '@/shared/theme/components/SearchBar';
import { SkeletonList, TrackRowSkeleton } from '@/shared/theme/components/Skeleton';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { SearchTracks } from '@/features/playlists/features/editor/features/search-tracks/searchTracksTypes';
import { SearchTracksResults } from '@/features/playlists/features/editor/features/search-tracks/components/presenters/SearchTracksResults';

type SearchTracksViewProps = {
	screen: SearchTracks;
	bottomPadding: number;
};

export function SearchTracksView({ screen, bottomPadding }: SearchTracksViewProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.container}>
			<View style={styles.searchContainer}>
				<SearchBar
					value={screen.search.text}
					onChangeText={screen.search.change}
					placeholder="Rechercher sur SoundCloud..."
					loading={screen.isLoading}
					input={{ autoFocus: true }}
				/>
			</View>
			{screen.isLoading && screen.results.length === 0 ? (
				<SkeletonList count={8} row={TrackRowSkeleton} />
			) : (
				<SearchTracksResults screen={screen} bottomPadding={bottomPadding} />
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		searchContainer: {
			paddingHorizontal: theme.spacing.md,
			paddingVertical: theme.spacing.sm,
		},
	});
	return styles;
}
