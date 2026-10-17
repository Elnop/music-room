import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Avatar } from '@/components/common/Avatar';
import { EmptyState } from '@/components/common/EmptyState';
import type { Theme } from '@themes/types';
import type { Playlist } from '@/types/playlist.types';
import type { FriendProfile } from '@/services/friendsApi';

const CARD_WIDTH = 140;

interface FriendPlaylistData {
	friend: FriendProfile;
	playlists: Playlist[];
}

interface FriendPlaylistSectionProps {
	friendsPlaylists: FriendPlaylistData[];
	onPlaylistPress: (playlistId: string) => void;
	onFriendPress?: (friendId: string) => void;
	/** Leads to the friends tab from the empty state */
	onFindFriends?: () => void;
}

export function FriendPlaylistSection({
	friendsPlaylists,
	onPlaylistPress,
	onFriendPress,
	onFindFriends,
}: FriendPlaylistSectionProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	// Flatten pour un scroll horizontal continu avec les infos de l'ami
	const allPlaylists = friendsPlaylists.flatMap(fp =>
		fp.playlists.map(playlist => ({
			playlist,
			friend: fp.friend,
		}))
	);

	if (allPlaylists.length === 0) {
		return (
			<EmptyState
				icon="people-outline"
				message="Aucune playlist de vos amis pour l'instant. Vos amis sont les personnes que vous suivez et qui vous suivent en retour."
				action={onFindFriends ? { label: 'Trouver des amis', onPress: onFindFriends } : undefined}
			/>
		);
	}

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.scrollContent}
			decelerationRate="fast"
			snapToInterval={CARD_WIDTH + 12}
		>
			{allPlaylists.map(({ playlist, friend }) => (
				<FriendPlaylistCard
					key={`${friend.id}-${playlist.id}`}
					playlist={playlist}
					friend={friend}
					onPress={() => onPlaylistPress(playlist.id)}
					onFriendPress={onFriendPress ? () => onFriendPress(friend.id) : undefined}
				/>
			))}
		</ScrollView>
	);
}

interface FriendPlaylistCardProps {
	playlist: Playlist;
	friend: FriendProfile;
	onPress: () => void;
	onFriendPress?: () => void;
}

function FriendPlaylistCard({ playlist, friend, onPress, onFriendPress }: FriendPlaylistCardProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const coverUrl = playlist.coverUrl || playlist.firstTrackCover;

	return (
		<TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.6}>
			<View style={styles.coverContainer}>
				<View style={styles.coverWrapper}>
					{coverUrl ? (
						<Image source={{ uri: coverUrl }} style={styles.cover} />
					) : (
						<View style={[styles.cover, styles.emptyCover]}>
							<Ionicons name="musical-notes" size={28} color={theme.colors.textSecondary} />
						</View>
					)}
				</View>

				{/* Friend avatar badge - outside coverWrapper to allow overflow */}
				<TouchableOpacity style={styles.friendBadge} onPress={onFriendPress} activeOpacity={0.8}>
					<Avatar
						uri={friend.avatarUrl}
						name={friend.displayName || friend.username}
						size="sm"
						style={styles.friendAvatar}
					/>
				</TouchableOpacity>
			</View>

			<View style={styles.cardInfo}>
				<Text style={styles.playlistName} numberOfLines={1}>
					{playlist.name}
				</Text>
				<Text style={styles.friendName} numberOfLines={1}>
					par {friend.displayName || friend.username}
				</Text>
			</View>
		</TouchableOpacity>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		scrollContent: {
			paddingHorizontal: theme.spacing.md,
			paddingBottom: theme.spacing.sm,
		},
		card: {
			width: CARD_WIDTH,
			marginRight: 12,
		},
		coverContainer: {
			position: 'relative',
			width: CARD_WIDTH,
			height: CARD_WIDTH,
		},
		coverWrapper: {
			width: CARD_WIDTH,
			height: CARD_WIDTH,
			borderRadius: 8,
			overflow: 'hidden',
			backgroundColor: theme.colors.surfaceAlt,
		},
		cover: {
			width: '100%',
			height: '100%',
		},
		emptyCover: {
			justifyContent: 'center',
			alignItems: 'center',
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
