import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Artwork } from '@/shared/components/media/Artwork';
import { Avatar } from '@/shared/components/media/Avatar';
import { Pressable } from '@/shared/components/ui/Pressable';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { FriendPlaylists } from '@/features/playlists/types';

/** Width of a card; the playlists screen's skeleton uses it too. */
export const FRIEND_CARD_WIDTH = 140;

interface FriendPlaylistCarouselProps {
	friendsPlaylists: FriendPlaylists[];
	onPlaylistPress: (playlistId: string) => void;
	/** Leads to the friends tab from the empty state. */
	onFindFriends: () => void;
}

export function FriendPlaylistCarousel({
	friendsPlaylists,
	onPlaylistPress,
	onFindFriends,
}: FriendPlaylistCarouselProps) {
	const { styles } = useThemedStyles(createStyles);
	const cards = friendsPlaylists.flatMap(({ friend, playlists }) =>
		playlists.map(playlist => ({ friend, playlist }))
	);

	if (cards.length === 0) {
		return (
			<EmptyState
				icon="people-outline"
				message="Aucune playlist de vos amis pour l'instant. Vos amis sont les personnes que vous suivez et qui vous suivent en retour."
				action={{ label: 'Trouver des amis', onPress: onFindFriends }}
			/>
		);
	}

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.scrollContent}
			decelerationRate="fast"
			snapToInterval={FRIEND_CARD_WIDTH + 12}
		>
			{cards.map(({ friend, playlist }) => {
				const friendName = friend.displayName || friend.username;
				return (
					<Pressable
						key={`${friend.id}-${playlist.id}`}
						style={styles.card}
						onPress={() => onPlaylistPress(playlist.id)}
						accessibilityLabel={playlist.name}
					>
						<View>
							<Artwork
								uri={playlist.coverUrl || playlist.firstTrackCover}
								size={FRIEND_CARD_WIDTH}
								iconSize={28}
								style={styles.cover}
							/>
							<View style={styles.friendBadge}>
								<Avatar
									uri={friend.avatarUrl}
									name={friendName}
									size="sm"
									style={styles.friendAvatar}
								/>
							</View>
						</View>
						<View style={styles.cardInfo}>
							<Text style={styles.playlistName} numberOfLines={1}>
								{playlist.name}
							</Text>
							<Text style={styles.friendName} numberOfLines={1}>
								par {friendName}
							</Text>
						</View>
					</Pressable>
				);
			})}
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
		friendBadge: {
			position: 'absolute',
			bottom: -6,
			right: -6,
		},
		friendAvatar: {
			borderWidth: 2,
			borderColor: theme.colors.background,
		},
		cardInfo: {
			marginTop: theme.spacing.sm,
			paddingHorizontal: 2,
		},
		playlistName: {
			fontSize: theme.typography.sizes.sm,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
			marginBottom: 2,
		},
		friendName: {
			fontSize: theme.typography.sizes.xs,
			color: theme.colors.textSecondary,
		},
	});
