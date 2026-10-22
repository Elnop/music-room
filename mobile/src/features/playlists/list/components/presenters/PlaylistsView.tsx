import React from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { PlaylistCardSkeleton, SkeletonList } from '@/shared/components/ui/Skeleton';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Playlist } from '@/features/playlists/types';
import type { PlaylistsScreen } from '@/features/playlists/list/hooks/usePlaylistsScreen';
import { FriendPlaylistCarousel } from './FriendPlaylistCarousel';
import { createListStyles } from './listStyles';
import { PlaylistGridCard } from './PlaylistCards';
import { FriendCardSkeleton, PlaylistsSkeleton } from './PlaylistsSkeleton';
import { SectionHeader } from './SectionHeader';

const countAll = (screen: PlaylistsScreen) =>
	screen.friendsPlaylists.reduce((total, entry) => total + entry.playlists.length, 0);

/** The playlists screen: friends' carousel, my playlists, then the public ones. */
export function PlaylistsView({ screen }: { screen: PlaylistsScreen }) {
	const { styles: styles, theme } = useThemedStyles(createListStyles);

	if (screen.isInitialLoading) return <PlaylistsSkeleton />;

	const grid = (playlists: Playlist[], showOwner = false) => (
		<View style={styles.grid}>
			{playlists.map(playlist => (
				<PlaylistGridCard
					key={playlist.id}
					playlist={playlist}
					onPress={() => screen.openPlaylist(playlist.id)}
					showOwner={showOwner}
				/>
			))}
		</View>
	);

	const header = (
		<View>
			<View style={styles.section}>
				<SectionHeader
					icon="people-outline"
					title="Playlists de vos amis"
					count={countAll(screen)}
				/>
				{screen.friendsLoading && screen.friendsPlaylists.length === 0 ? (
					<SkeletonList count={3} row={FriendCardSkeleton} style={styles.friendsSkeleton} />
				) : (
					<FriendPlaylistCarousel
						friendsPlaylists={screen.friendsPlaylists}
						onPlaylistPress={screen.openPlaylist}
						onFindFriends={screen.findFriends}
					/>
				)}
			</View>
			<View style={styles.sectionSpacer} />
			<View style={styles.section}>
				<SectionHeader
					icon="library-outline"
					title="Vos playlists"
					count={screen.myPlaylists.length}
					open={screen.myOpen}
					onToggle={screen.toggleMy}
				/>
				{screen.myOpen &&
					(screen.myPlaylists.length > 0 ? (
						grid(screen.myPlaylists)
					) : (
						<EmptyState
							icon="musical-notes-outline"
							message="Aucune playlist pour l'instant. Créez votre première playlist !"
							action={{ label: 'Créer une playlist', onPress: screen.createPlaylist }}
						/>
					))}
			</View>
		</View>
	);

	const footer = (
		<View>
			<View style={styles.sectionSpacer} />
			<View style={styles.section}>
				<SectionHeader
					icon="globe-outline"
					title="Playlists publiques"
					count={screen.publicPlaylists.length}
					open={screen.publicOpen}
					onToggle={screen.togglePublic}
				/>
				{screen.publicOpen &&
					(screen.publicLoading && screen.publicPlaylists.length === 0 ? (
						<SkeletonList count={4} row={PlaylistCardSkeleton} style={styles.grid} />
					) : screen.publicPlaylists.length > 0 ? (
						grid(screen.publicPlaylists, true)
					) : (
						<EmptyState icon="globe-outline" message="Aucune playlist publique disponible" />
					))}
			</View>
		</View>
	);

	return (
		<View style={styles.container}>
			<FlatList
				data={[]}
				keyExtractor={() => 'dummy'}
				ListHeaderComponent={header}
				ListFooterComponent={footer}
				renderItem={() => null}
				contentContainerStyle={[
					styles.list,
					{ paddingBottom: screen.playerHeight + theme.spacing.xl },
				]}
				refreshControl={
					<RefreshControl
						refreshing={screen.isRefreshing}
						onRefresh={screen.refresh}
						tintColor={theme.colors.primary}
						colors={[theme.colors.primary]}
					/>
				}
				showsVerticalScrollIndicator={false}
			/>
		</View>
	);
}
