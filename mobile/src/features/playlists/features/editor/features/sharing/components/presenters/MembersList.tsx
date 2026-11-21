import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SwipeableUserItem } from '@/features/playlists/features/editor/features/sharing/components/presenters/SwipeableUserItem';
import type { PlaylistMember } from '@/features/playlists/shared/playlist/playlistTypes';

type MembersListProps = {
	members: PlaylistMember[];
	onRemove: (userId: string) => Promise<void>;
};

export function MembersList({ members, onRemove }: MembersListProps) {
	return (
		<FlatList
			data={members}
			keyExtractor={item => item.id}
			style={styles.list}
			scrollEnabled={false}
			renderItem={({ item }) => (
				<SwipeableUserItem
					user={{
						id: item.id,
						username: item.username,
						display_name: item.displayName,
						avatar_url: item.avatarUrl,
					}}
					role={item.canEdit ? 'collaborator' : 'viewer'}
					onRemove={onRemove}
				/>
			)}
		/>
	);
}

const styles = StyleSheet.create({
	list: {
		flex: 1,
	},
});
