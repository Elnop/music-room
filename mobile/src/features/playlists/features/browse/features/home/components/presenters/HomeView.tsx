import React from 'react';
import { View } from 'react-native';
import type { HomeScreen } from '@/features/playlists/features/browse/features/home/homeTypes';
import type { Playlist } from '@/features/playlists/shared/playlist/playlistTypes';
import { FriendsPlaylistsSection } from '@/features/playlists/features/browse/features/home/components/presenters/FriendsPlaylistsSection';
import { HomeSection } from '@/features/playlists/features/browse/features/home/components/presenters/HomeSection';
import { HomeSkeleton } from '@/features/playlists/features/browse/features/home/components/presenters/HomeSkeleton';
import { PublicPlaylistsSection } from '@/features/playlists/features/browse/features/home/components/presenters/PublicPlaylistsSection';
import { RefreshableScroll } from '@/features/playlists/features/browse/shared/playlist-grid/components/RefreshableScroll';

type HomeViewProps = {
	screen: HomeScreen;
	nearbyEvents?: React.ReactNode;
	similarProfiles?: React.ReactNode;
	onPlaylistActions?: (playlist: Playlist) => (() => void) | undefined;
};

export function HomeView({
	screen,
	nearbyEvents,
	similarProfiles,
	onPlaylistActions,
}: HomeViewProps) {
	if (screen.isInitialLoading) return <HomeSkeleton />;

	return (
		<RefreshableScroll
			isRefreshing={screen.isRefreshing}
			onRefresh={screen.refresh}
			bottomPadding={screen.bottomPadding}
		>
			<View>
				{nearbyEvents && <HomeSection spacer="after">{nearbyEvents}</HomeSection>}
				<FriendsPlaylistsSection screen={screen} />
				<HomeSection>
					<PublicPlaylistsSection screen={screen} onPlaylistActions={onPlaylistActions} />
				</HomeSection>
				{similarProfiles && <HomeSection spacer="before">{similarProfiles}</HomeSection>}
			</View>
		</RefreshableScroll>
	);
}
