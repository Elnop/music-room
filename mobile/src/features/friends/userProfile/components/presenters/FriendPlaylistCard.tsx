import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Artwork } from '@/shared/components/media/Artwork';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import type { FriendPlaylistSummary } from '@/features/friends/types';

interface FriendPlaylistCardProps {
	playlist: FriendPlaylistSummary;
	ownerName: string;
	onPress: () => void;
}

const tracksLabel = (count: number) => `${count} ${count === 1 ? 'titre' : 'titres'}`;

export function FriendPlaylistCard({ playlist, ownerName, onPress }: FriendPlaylistCardProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const coverUri = playlist.coverUrl || playlist.firstTrackCover;

	return (
		<Pressable style={styles.row} onPress={onPress} accessibilityLabel={playlist.name}>
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

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: 8,
			paddingHorizontal: theme.spacing.md,
		},
		rowCover: {
			borderRadius: 4,
		},
		rowInfo: {
			flex: 1,
			marginLeft: theme.spacing.md,
		},
		rowName: {
			fontSize: theme.typography.sizes.md,
			fontWeight: theme.typography.weights.medium,
			color: theme.colors.text,
			marginBottom: 2,
		},
		meta: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
