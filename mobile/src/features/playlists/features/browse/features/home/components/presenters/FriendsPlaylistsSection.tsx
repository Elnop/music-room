import React from 'react';
import { SectionHeader } from '@/shared/theme/components/SectionHeader';
import type { HomeScreen } from '@/features/playlists/features/browse/features/home/homeTypes';
import { FriendPlaylistCarousel } from '@/features/playlists/features/browse/features/home/components/presenters/FriendPlaylistCarousel';
import { HomeSection } from '@/features/playlists/features/browse/features/home/components/presenters/HomeSection';
import UsersSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/users-solid.svg';

type FriendsPlaylistsSectionProps = {
	screen: HomeScreen;
};

export function FriendsPlaylistsSection({ screen }: FriendsPlaylistsSectionProps) {
	if (screen.friendsCount === 0) return null;
	return (
		<HomeSection spacer="after">
			<SectionHeader icon={UsersSolid} title="Playlists de vos amis" count={screen.friendsCount} />
			<FriendPlaylistCarousel
				friendsPlaylists={screen.friendsPlaylists}
				onPlaylistPress={screen.openPlaylist}
			/>
		</HomeSection>
	);
}
