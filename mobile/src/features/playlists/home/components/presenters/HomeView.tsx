import React from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { SectionHeader } from '@/shared/components/lists/SectionHeader';
import { PlaylistCardSkeleton, SkeletonList } from '@/shared/components/ui/Skeleton';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { HomeScreen } from '@/features/playlists/home/hooks/useHomeScreen';
import { FriendPlaylistCarousel } from './FriendPlaylistCarousel';
import { createListStyles } from './listStyles';
import { PlaylistGrid } from './PlaylistGrid';
import { FriendCardSkeleton } from './FriendCardSkeleton';
import { HomeSkeleton } from './HomeSkeleton';
import { RefreshableScroll } from './RefreshableScroll';

const countAll = (screen: HomeScreen) =>
	screen.friendsPlaylists.reduce((total, entry) => total + entry.playlists.length, 0);

interface HomeViewProps {
	screen: HomeScreen;
	nearbyEvents?: React.ReactNode;
}

export function HomeView({ screen, nearbyEvents }: HomeViewProps) {
	const { styles } = useThemedStyles(createListStyles);
	const { isWide } = useBreakpoint();

	if (screen.isInitialLoading) return <HomeSkeleton />;

	const content = (
		<View>
			{nearbyEvents && (
				<>
					<View style={styles.section}>{nearbyEvents}</View>
					<View style={styles.sectionSpacer} />
				</>
			)}
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
						<PlaylistGrid playlists={screen.publicPlaylists} onOpen={screen.openPlaylist} />
					) : (
						<EmptyState
							icon="globe-outline"
							message="Aucune playlist publique disponible"
							compact={isWide}
						/>
					))}
			</View>
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
