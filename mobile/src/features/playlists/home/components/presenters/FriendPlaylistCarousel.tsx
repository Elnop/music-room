import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Artwork } from '@/shared/components/media/Artwork';
import { Pressable } from '@/shared/components/ui/Pressable';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { FriendPlaylists } from '@/features/playlists/types';
import { playlistCardLabel, tracksLabel } from '@/features/playlists/home/utils/playlistLabels';
import { OwnerAvatarBadge } from './OwnerAvatarBadge';
import { Text } from '@/shared/components/ui/Text';

/** Width of a card; the playlists screen's skeleton uses it too. */
export const FRIEND_CARD_WIDTH = 140;

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
			snapToInterval={FRIEND_CARD_WIDTH + 12}
		>
			{cards.map(({ friend, playlist }) => (
				<Pressable
					key={`${friend.id}-${playlist.id}`}
					style={styles.card}
					onPress={() => onPlaylistPress(playlist.id)}
					accessibilityLabel={playlistCardLabel(playlist.name, friend)}
				>
					<View>
						<Artwork
							uri={playlist.coverUrl || playlist.firstTrackCover}
							size={FRIEND_CARD_WIDTH}
							iconSize={28}
							style={styles.cover}
						/>
						<OwnerAvatarBadge owner={friend} />
					</View>
					<View style={styles.cardInfo}>
						<Text style={styles.playlistName} numberOfLines={1}>
							{playlist.name}
						</Text>
						<Text style={styles.trackCount} numberOfLines={1}>
							{tracksLabel(playlist.trackCount)}
						</Text>
					</View>
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
		card: {
			width: FRIEND_CARD_WIDTH,
			marginRight: 12,
		},
		cover: {
			borderRadius: 8,
		},
		cardInfo: {
			marginTop: theme.spacing.sm,
			paddingHorizontal: 2,
		},
		playlistName: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
			marginBottom: 2,
		},
		trackCount: {
			fontSize: theme.typography.sizes.xs,
			color: theme.colors.textSecondary,
		},
	});
