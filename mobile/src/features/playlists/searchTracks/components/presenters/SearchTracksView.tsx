import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { SearchBar } from '@/shared/components/form/SearchBar';
import { SkeletonList, TrackRowSkeleton } from '@/shared/components/ui/Skeleton';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { SearchTracks } from '@/features/playlists/searchTracks/hooks/useSearchTracks';
import { AddableTrackRow } from './AddableTrackRow';

interface SearchTracksViewProps {
	screen: SearchTracks;
	playerHeight: number;
}

/** « Ajouter des titres »: a SoundCloud search whose results add to the playlist. */
export function SearchTracksView({ screen, playerHeight }: SearchTracksViewProps) {
	const { styles, theme } = useThemedStyles(createStyles);
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
					contentContainerStyle={[styles.list, { paddingBottom: playerHeight + theme.spacing.xl }]}
					showsVerticalScrollIndicator={false}
					ListEmptyComponent={
						typed && screen.isLoading ? null : (
							<EmptyState
								icon="musical-notes-outline"
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
