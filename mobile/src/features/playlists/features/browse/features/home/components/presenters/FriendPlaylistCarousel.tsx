import React from 'react';
import { SnapCarousel } from '@/shared/theme/components/SnapCarousel';
import type { FriendPlaylists } from '@/features/playlists/shared/playlist/playlistTypes';
import { FriendPlaylistCard } from '@/features/playlists/features/browse/features/home/components/presenters/FriendPlaylistCard';
import { friendCards } from '@/features/playlists/features/browse/features/home/friendCards';
import { FRIEND_CARD_WIDTH } from '@/features/playlists/features/browse/features/home/friendCardConfig';

type FriendPlaylistCarouselProps = {
	friendsPlaylists: FriendPlaylists[];
	onPlaylistPress: (playlistId: string) => void;
};

export function FriendPlaylistCarousel({
	friendsPlaylists,
	onPlaylistPress,
}: FriendPlaylistCarouselProps) {
	return (
		<SnapCarousel itemWidth={FRIEND_CARD_WIDTH}>
			{friendCards(friendsPlaylists).map(({ friend, playlist }) => (
				<FriendPlaylistCard
					key={`${friend.id}-${playlist.id}`}
					friend={friend}
					playlist={playlist}
					onPress={() => onPlaylistPress(playlist.id)}
				/>
			))}
		</SnapCarousel>
	);
}
