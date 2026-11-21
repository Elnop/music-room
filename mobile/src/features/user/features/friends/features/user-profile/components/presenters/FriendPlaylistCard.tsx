import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Artwork } from '@/shared/theme/components/Artwork';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { Theme } from '@/shared/theme/lib/types';
import type { FriendPlaylistSummary } from '@/features/user/features/friends/types';
import { Text } from '@/shared/theme/components/Text';

interface FriendPlaylistCardProps {
	playlist: FriendPlaylistSummary;
	ownerName: string;
	onPress: () => void;
	style?: StyleProp<ViewStyle>;
}

function tracksLabel(count: number) {
	return `${count} ${count === 1 ? 'titre' : 'titres'}`;
}

export function FriendPlaylistCard({
	playlist,
	ownerName,
	onPress,
	style,
}: FriendPlaylistCardProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const coverUri = playlist.coverUrl || playlist.firstTrackCover;

	return (
		<Pressable style={[styles.row, style]} onPress={onPress} accessibilityLabel={playlist.name}>
			<Artwork uri={coverUri} size={48} iconSize={24} style={styles.rowCover} />
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
	return StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: 8,
			paddingHorizontal: theme.spacing.md,
		},
		rowCover: {},
		rowInfo: {
			flex: 1,
			marginLeft: theme.spacing.md,
		},
		rowName: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.text,
			marginBottom: 2,
		},
		meta: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
}
