import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { SearchBar } from '@/shared/theme/components/SearchBar';
import { SkeletonList, TrackRowSkeleton } from '@/shared/theme/components/Skeleton';
import type { Theme } from '@/shared/theme/lib/types';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { SearchTracks } from '@/features/playlists/searchTracks/useSearchTracks';
import { AddableTrackRow } from './AddableTrackRow';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

interface SearchTracksViewProps {
	screen: SearchTracks;
	bottomPadding: number;
}

export function SearchTracksView({ screen, bottomPadding }: SearchTracksViewProps) {
	const { styles } = useThemedStyles(createStyles);
	const typed = screen.search.text.trim() !== '';

	return (
		<View style={styles.container}>
			<View style={styles.searchContainer}>
				<SearchBar
					value={screen.search.text}
					onChangeText={screen.search.change}
					placeholder="Rechercher sur SoundCloud..."
					loading={screen.isLoading}
					autoFocus
				/>
			</View>

			{screen.isLoading && screen.results.length === 0 ? (
				<SkeletonList count={8} row={TrackRowSkeleton} />
			) : (
				<FlatList
					data={screen.results}
					keyExtractor={item => item.id.toString()}
					renderItem={({ item }) => (
						<AddableTrackRow
							track={item}
							isAdded={screen.isAdded(item)}
							onAdd={screen.add}
							onAddToQueue={screen.addToQueue}
							onShowActions={screen.showActions}
						/>
					)}
					contentContainerStyle={[styles.list, { paddingBottom: bottomPadding }]}
					showsVerticalScrollIndicator={false}
					ListEmptyComponent={
						typed && screen.isLoading ? null : (
							<EmptyState
								icon={MusicSolid}
								message={
									typed
										? 'Aucun titre trouvé'
										: 'Recherchez des titres sur SoundCloud pour les ajouter à votre playlist'
								}
							/>
						)
					}
				/>
			)}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		searchContainer: {
			paddingHorizontal: theme.spacing.md,
			paddingVertical: theme.spacing.sm,
		},
		list: {
			flexGrow: 1,
			paddingTop: theme.spacing.sm,
		},
	});
