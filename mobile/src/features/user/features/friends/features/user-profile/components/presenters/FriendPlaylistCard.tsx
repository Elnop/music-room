import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Artwork } from '@/shared/theme/components/Artwork';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { FriendPlaylistSummary } from '@/features/user/features/friends/friendsTypes';
import { Text } from '@/shared/theme/components/Text';

type FriendPlaylistCardProps = {
	playlist: FriendPlaylistSummary;
	ownerName: string;
	onPress: () => void;
	style?: StyleProp<ViewStyle>;
};

function tracksLabel(count: number) {
	return `${count} ${count === 1 ? 'titre' : 'titres'}`;
}

export function FriendPlaylistCard({
	playlist,
	ownerName,
	onPress,
	style,
}: FriendPlaylistCardProps) {
	const { styles } = useThemedStyles(createStyles);
	const coverUri = playlist.coverUrl || playlist.firstTrackCover;

	return (
		<Pressable style={[styles.row, style]} onPress={onPress} accessibilityLabel={playlist.name}>
			<Artwork uri={coverUri} size={48} iconSize={24} />
			<View style={styles.rowInfo}>
				<Text style={styles.rowName} numberOfLines={1}>
					{playlist.name}
				</Text>
				<Text style={styles.meta} numberOfLines={1}>
					{tracksLabel(playlist.trackCount)} • {ownerName}
				</Text>
			</View>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: theme.spacing.sm,
			paddingHorizontal: theme.spacing.md,
		},
		rowInfo: {
			flex: 1,
			marginLeft: theme.spacing.md,
		},
		rowName: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.text,
			marginBottom: theme.spacing.xxs,
		},
		meta: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
