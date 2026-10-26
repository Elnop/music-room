import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '@/shared/components/media/Avatar';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { UserSummary } from '@/features/playlists/types';
import { ownerName } from '@/features/playlists/home/utils/playlistLabels';

/** The playlist's owner, in the bottom right corner of its cover; the card's label names them. */
export function OwnerAvatarBadge({ owner }: { owner: UserSummary }) {
	const { styles } = useThemedStyles(createStyles);
	return (
		<View style={styles.badge} importantForAccessibility="no-hide-descendants" accessible={false}>
			<Avatar uri={owner.avatarUrl} name={ownerName(owner)} size="sm" style={styles.avatar} />
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		badge: {
			position: 'absolute',
			bottom: -6,
			right: -6,
		},
		avatar: {
			borderWidth: 2,
			borderColor: theme.colors.background,
		},
	});
