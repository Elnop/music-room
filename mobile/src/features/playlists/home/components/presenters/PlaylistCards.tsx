import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Artwork } from '@/shared/components/media/Artwork';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useGridTileWidth } from '@/shared/hooks/useGridTileWidth';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Playlist } from '@/features/playlists/types';
import { playlistCardLabel, tracksLabel } from '@/features/playlists/home/utils/playlistLabels';
import { OwnerAvatarBadge } from './OwnerAvatarBadge';
import { PrivateBadge } from './PrivateBadge';
import { Text } from '@/shared/components/ui/Text';

const coverOf = (playlist: Playlist) => playlist.coverUrl || playlist.firstTrackCover;

interface PlaylistGridCardProps {
	playlist: Playlist;
	onPress: () => void;
}

export function PlaylistGridCard({ playlist, onPress }: PlaylistGridCardProps) {
	const { styles } = useThemedStyles(createStyles);
	const width = useGridTileWidth();
	const { owner } = playlist;

	return (
		<Pressable
			style={[styles.tile, { width }]}
			onPress={onPress}
			accessibilityLabel={playlistCardLabel(playlist.name, owner)}
		>
			<View>
				<Artwork uri={coverOf(playlist)} size={width} iconSize={32} style={styles.tileCover} />
				{playlist.visibility === 'private' && <PrivateBadge style={styles.tileBadge} />}
				{owner && <OwnerAvatarBadge owner={owner} />}
			</View>
			<View style={styles.tileInfo}>
				<Text style={styles.tileName} numberOfLines={1}>
					{playlist.name}
				</Text>
				<Text style={styles.meta} numberOfLines={1}>
					{tracksLabel(playlist.trackCount)}
				</Text>
			</View>
		</Pressable>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		meta: { fontSize: theme.typography.sizes.sm, color: theme.colors.textSecondary },
		tile: { marginBottom: theme.spacing.lg },
		tileCover: { borderRadius: 8 },
		tileBadge: { position: 'absolute', top: 8, right: 8, paddingVertical: 3 },
		tileInfo: { marginTop: theme.spacing.sm, paddingHorizontal: 2 },
		tileName: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
			marginBottom: 2,
		},
	});
