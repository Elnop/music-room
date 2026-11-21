import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
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
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.scrollContent}
			decelerationRate="fast"
			snapToInterval={FRIEND_CARD_WIDTH + theme.spacing.md}
		>
			{friendCards(friendsPlaylists).map(({ friend, playlist }) => (
				<FriendPlaylistCard
					key={`${friend.id}-${playlist.id}`}
					friend={friend}
					playlist={playlist}
					onPress={() => onPlaylistPress(playlist.id)}
				/>
			))}
		</ScrollView>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		scrollContent: {
			paddingHorizontal: theme.spacing.md,
			paddingBottom: theme.spacing.sm,
		},
	});
	return styles;
}
