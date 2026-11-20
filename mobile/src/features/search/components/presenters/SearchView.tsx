import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl, type TextInput } from 'react-native';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { SearchBar } from '@/shared/theme/components/SearchBar';
import { SkeletonList, TrackRowSkeleton } from '@/shared/theme/components/Skeleton';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import type { TrackActionsSheetComponent } from '@/shared/playback/lib/trackActionsSheet';
import { SoundCloudTrackItem } from './SoundCloudTrackItem';
import type { Theme } from '@/shared/theme/lib/types';
import type { SoundCloudTrack } from '@/features/search/lib/types';
import type { AddQueueItemBody } from '@/shared/playback/lib/playback';
import { useContentColumn } from '@/shared/theme/hooks/useContentColumn';
import ExclamationTriangleSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/exclamation-triangle-solid.svg';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';
import type { MenuAnchor } from '@/shared/theme/lib/menuPlacement';

interface SearchViewProps {
	TrackActionsSheet: TrackActionsSheetComponent;
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
	onShowActions: (track: SoundCloudTrack, anchor?: MenuAnchor) => void;
	onCloseActions: () => void;
}

export function SearchView({
	TrackActionsSheet,
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
								icon={ExclamationTriangleSolid}
								message="La recherche a échoué"
								action={{ label: 'Réessayer', onPress: onRetry }}
							/>
						) : (
							<EmptyState
								icon={MusicSolid}
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

			<TrackActionsSheet track={actionTrack} onClose={onCloseActions} />
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
