import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Pressable } from '@/shared/components/ui/Pressable';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { FriendPlaylists } from '@/features/playlists/types';
import { playlistCardLabel } from '@/features/playlists/home/utils/playlistLabels';
import { PlaylistCassette } from './PlaylistCassette';

/** Width of a card; the playlists screen's skeleton uses it too. */
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
