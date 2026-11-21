import React from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { SectionHeader } from '@/shared/theme/components/SectionHeader';
import { PlaylistCardSkeleton, SkeletonList } from '@/shared/theme/components/Skeleton';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { HomeScreen } from '@/features/playlists/features/browse/features/home/useHomeScreen';
import type { Playlist } from '@/features/playlists/shared/playlist/lib/types';
import { FriendPlaylistCarousel } from '@/features/playlists/features/browse/features/home/components/presenters/FriendPlaylistCarousel';
import { createListStyles } from '@/features/playlists/features/browse/shared/playlist-grid/lib/listStyles';
import { PlaylistGrid } from '@/features/playlists/features/browse/shared/playlist-grid/components/PlaylistGrid';
import { HomeSkeleton } from '@/features/playlists/features/browse/features/home/components/presenters/HomeSkeleton';
import { RefreshableScroll } from '@/features/playlists/features/browse/shared/playlist-grid/components/RefreshableScroll';
import GlobeSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/globe-solid.svg';
import UsersSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/users-solid.svg';

function countAll(screen: HomeScreen) {
	return screen.friendsPlaylists.reduce((total, entry) => total + entry.playlists.length, 0);
}

interface HomeViewProps {
	screen: HomeScreen;
	nearbyEvents?: React.ReactNode;
	similarProfiles?: React.ReactNode;
	actionsFor?: (playlist: Playlist) => (() => void) | undefined;
}

export function HomeView({ screen, nearbyEvents, similarProfiles, actionsFor }: HomeViewProps) {
	const { styles } = useThemedStyles(createListStyles);
	const { isWide } = useBreakpoint();

	if (screen.isInitialLoading) return <HomeSkeleton />;
	const friendsCount = countAll(screen);

	const content = (
		<View>
			{nearbyEvents && (
				<>
					<View style={styles.section}>{nearbyEvents}</View>
					<View style={styles.sectionSpacer} />
				</>
			)}
			{friendsCount > 0 && (
				<>
					<View style={styles.section}>
						<SectionHeader icon={UsersSolid} title="Playlists de vos amis" count={friendsCount} />
						<FriendPlaylistCarousel
							friendsPlaylists={screen.friendsPlaylists}
							onPlaylistPress={screen.openPlaylist}
						/>
					</View>
					<View style={styles.sectionSpacer} />
				</>
			)}
			<View style={styles.section}>
				<SectionHeader
					icon={GlobeSolid}
					title="Playlists publiques"
					count={screen.publicPlaylists.length}
					open={screen.publicOpen}
					onToggle={screen.togglePublic}
				/>
				{screen.publicOpen &&
					(screen.publicLoading && screen.publicPlaylists.length === 0 ? (
						<SkeletonList count={4} row={PlaylistCardSkeleton} style={styles.grid} />
					) : screen.publicPlaylists.length > 0 ? (
						<PlaylistGrid
							playlists={screen.publicPlaylists}
							onOpen={screen.openPlaylist}
							actionsFor={actionsFor}
						/>
					) : (
						<EmptyState
							icon={GlobeSolid}
							message="Aucune playlist publique disponible"
							compact={isWide}
						/>
					))}
			</View>
			{similarProfiles && (
				<>
					<View style={styles.sectionSpacer} />
					<View style={styles.section}>{similarProfiles}</View>
				</>
			)}
		</View>
	);

	return (
		<RefreshableScroll
			isRefreshing={screen.isRefreshing}
			onRefresh={screen.refresh}
			bottomPadding={screen.bottomPadding}
		>
			{content}
		</RefreshableScroll>
	);
}
