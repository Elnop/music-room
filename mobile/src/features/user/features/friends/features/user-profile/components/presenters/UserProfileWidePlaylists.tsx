import React from 'react';
import { StyleSheet } from 'react-native';
import type { ProfilePlaylists } from '@/features/user/features/friends/features/user-profile/userProfileTypes';
import { FriendPlaylistList } from '@/features/user/features/friends/features/user-profile/components/presenters/FriendPlaylistList';
import { UserProfileWideSection } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileWideSection';

type UserProfileWidePlaylistsProps = {
	playlists: ProfilePlaylists;
	ownerName: string;
};

export function UserProfileWidePlaylists({ playlists, ownerName }: UserProfileWidePlaylistsProps) {
	if (playlists.items.length === 0) return null;
	return (
		<UserProfileWideSection title="Playlists">
			<FriendPlaylistList playlists={playlists} ownerName={ownerName} cardStyle={styles.playlist} />
		</UserProfileWideSection>
	);
}

const styles = StyleSheet.create({
	playlist: { paddingHorizontal: 0 },
});
