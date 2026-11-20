import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import type { Theme } from '@/shared/theme/lib/types';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { FriendPlaylists } from '@/features/playlists/shared/playlist/lib/types';
import { playlistCardLabel } from '@/features/playlists/features/browse/shared/playlist-grid/lib/playlistLabels';
import { PlaylistCassette } from '@/features/playlists/features/browse/shared/playlist-grid/components/PlaylistCassette';

export const FRIEND_CARD_WIDTH = 120;

interface FriendPlaylistCarouselProps {
	friendsPlaylists: FriendPlaylists[];
	onPlaylistPress: (playlistId: string) => void;
}

export function FriendPlaylistCarousel({
	friendsPlaylists,
	onPlaylistPress,
}: FriendPlaylistCarouselProps) {
	const { styles } = useThemedStyles(createStyles);
	const cards = friendsPlaylists.flatMap(({ friend, playlists }) =>
		playlists.map(playlist => ({ friend, playlist }))
	);

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.scrollContent}
			decelerationRate="fast"
			snapToInterval={FRIEND_CARD_WIDTH + 16}
		>
			{cards.map(({ friend, playlist }) => (
				<Pressable
					key={`${friend.id}-${playlist.id}`}
					style={styles.card}
					onPress={() => onPlaylistPress(playlist.id)}
					accessibilityLabel={playlistCardLabel(playlist.name, friend)}
				>
					<PlaylistCassette playlist={playlist} owner={friend} width={FRIEND_CARD_WIDTH} />
				</Pressable>
			))}
		</ScrollView>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		scrollContent: {
			paddingHorizontal: theme.spacing.md,
			paddingBottom: theme.spacing.sm,
		},
		card: { marginRight: theme.spacing.md },
	});
