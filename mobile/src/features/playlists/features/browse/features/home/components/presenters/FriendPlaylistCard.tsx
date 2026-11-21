import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Playlist, UserSummary } from '@/features/playlists/shared/playlist/playlistTypes';
import { playlistCardLabel } from '@/features/playlists/features/browse/shared/playlist-grid/lib/playlistLabels';
import { PlaylistCassette } from '@/features/playlists/features/browse/shared/playlist-grid/components/PlaylistCassette';
import { FRIEND_CARD_WIDTH } from '@/features/playlists/features/browse/features/home/friendCardConfig';

type FriendPlaylistCardProps = {
	friend: UserSummary;
	playlist: Playlist;
	onPress: () => void;
};

export function FriendPlaylistCard({ friend, playlist, onPress }: FriendPlaylistCardProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<Pressable
			style={styles.card}
			onPress={onPress}
			accessibilityLabel={playlistCardLabel(playlist.name, friend)}
		>
			<PlaylistCassette playlist={playlist} owner={friend} width={FRIEND_CARD_WIDTH} />
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		card: { marginRight: theme.spacing.md },
	});
	return styles;
}
