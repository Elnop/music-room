import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl, type TextInput } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { SearchBar } from '@/shared/components/form/SearchBar';
import { SkeletonList, TrackRowSkeleton } from '@/shared/components/ui/Skeleton';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { getTrackActionsSheet } from '@/shared/services/trackActionsBridge';
import { SoundCloudTrackItem } from './SoundCloudTrackItem';
import type { Theme } from '@/shared/theme/types';
import type { SoundCloudTrack } from '@/features/search/types';
import type { AddQueueItemBody } from '@/shared/types/playback';
import { useContentColumn } from '@/shared/hooks/useContentColumn';

interface SearchViewProps {
	inputRef: React.RefObject<TextInput | null>;
	searchQuery: string;
	debouncedQuery: string;
	isLoading: boolean;
	isRefreshing: boolean;
	isError: boolean;
	searchResults: SoundCloudTrack[];
	actionTrack: AddQueueItemBody | null;
	bottomPadding: number;
	onSearchChange: (text: string) => void;
	onRefresh: () => void;
	onRetry: () => void;
	onPlay: (track: SoundCloudTrack) => void;
	onAddToQueue: (track: SoundCloudTrack) => void;
	onShowActions: (track: SoundCloudTrack) => void;
	onCloseActions: () => void;
}

export function SearchView({
	inputRef,
	searchQuery,
	debouncedQuery,
	isLoading,
	isRefreshing,
	isError,
	searchResults,
	actionTrack,
	bottomPadding,
	onSearchChange,
	onRefresh,
	onRetry,
	onPlay,
	onAddToQueue,
	onShowActions,
	onCloseActions,
}: SearchViewProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const TrackActionsSheet = getTrackActionsSheet();
	const column = useContentColumn();

	return (
		<View style={styles.container}>
			<View style={[styles.header, column]}>
				<SearchBar
					inputRef={inputRef}
					value={searchQuery}
					onChangeText={onSearchChange}
					placeholder="Rechercher sur SoundCloud..."
					loading={isLoading && !isRefreshing}
				/>
			</View>

			{isLoading && !isRefreshing && searchResults.length === 0 ? (
				<SkeletonList count={8} row={TrackRowSkeleton} style={column} />
			) : (
				<FlatList
					data={searchResults}
					refreshControl={
						<RefreshControl
							refreshing={isRefreshing}
							onRefresh={onRefresh}
							tintColor={theme.colors.primary}
							colors={[theme.colors.primary]}
						/>
					}
					keyExtractor={item => item.id.toString()}
					renderItem={({ item }) => (
						<SoundCloudTrackItem
							track={item}
							onPlay={onPlay}
							onAddToQueue={onAddToQueue}
							onShowActions={onShowActions}
						/>
					)}
					contentContainerStyle={[{ paddingBottom: bottomPadding, flexGrow: 1 }, column]}
					ListEmptyComponent={
						isLoading ? null : isError && debouncedQuery.trim() ? (
							<EmptyState
								icon="alert"
								message="La recherche a échoué"
								action={{ label: 'Réessayer', onPress: onRetry }}
							/>
						) : (
							<EmptyState
								icon="note"
								message={
									searchQuery
										? 'Aucun titre trouvé'
										: 'Recherchez sur SoundCloud des titres à écouter ou à ajouter à vos playlists'
								}
							/>
						)
					}
				/>
			)}

			{TrackActionsSheet &&
				React.createElement(TrackActionsSheet, {
					track: actionTrack,
					onClose: onCloseActions,
				})}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		header: {
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.xs,
			paddingBottom: theme.spacing.md,
		},
	});
