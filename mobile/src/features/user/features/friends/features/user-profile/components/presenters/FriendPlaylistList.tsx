import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { ProfilePlaylists } from '@/features/user/features/friends/features/user-profile/userProfileTypes';
import { FriendPlaylistCard } from '@/features/user/features/friends/features/user-profile/components/presenters/FriendPlaylistCard';

type FriendPlaylistListProps = {
	playlists: ProfilePlaylists;
	ownerName: string;
	cardStyle?: StyleProp<ViewStyle>;
};

export function FriendPlaylistList({ playlists, ownerName, cardStyle }: FriendPlaylistListProps) {
	return (
		<>
			{playlists.items.map((playlist) => (
				<FriendPlaylistCard
					key={playlist.id}
					playlist={playlist}
					ownerName={ownerName}
					onPress={() => playlists.onSelect(playlist.id)}
					style={cardStyle}
				/>
			))}
		</>
	);
}
