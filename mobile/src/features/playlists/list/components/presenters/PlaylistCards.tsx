import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Artwork } from '@/shared/components/media/Artwork';
import { Pressable } from '@/shared/components/ui/Pressable';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Playlist } from '@/features/playlists/types';
import { PrivateBadge } from './PrivateBadge';

const GRID_CARD_WIDTH = (Dimensions.get('window').width - 48 - 8) / 2;

const coverOf = (playlist: Playlist) => playlist.coverUrl || playlist.firstTrackCover;
const tracksLabel = (count: number) => `${count} ${count === 1 ? 'titre' : 'titres'}`;

interface PlaylistGridCardProps {
	playlist: Playlist;
	onPress: () => void;
	/** « par <owner> » instead of the track count. */
	showOwner?: boolean;
}

export function PlaylistGridCard({ playlist, onPress, showOwner }: PlaylistGridCardProps) {
	const { styles } = useThemedStyles(createStyles);
	const owner = showOwner ? playlist.owner : undefined;

	return (
		<Pressable style={styles.tile} onPress={onPress} accessibilityLabel={playlist.name}>
			<View>
				<Artwork
					uri={coverOf(playlist)}
					size={GRID_CARD_WIDTH}
					iconSize={32}
					style={styles.tileCover}
				/>
				{playlist.visibility === 'private' && <PrivateBadge style={styles.tileBadge} />}
			</View>
			<View style={styles.tileInfo}>
				<Text style={styles.tileName} numberOfLines={1}>
					{playlist.name}
				</Text>
				<Text style={styles.meta} numberOfLines={1}>
					{owner ? `par ${owner.displayName || owner.username}` : tracksLabel(playlist.trackCount)}
				</Text>
			</View>
		</Pressable>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		meta: { fontSize: theme.typography.sizes.sm, color: theme.colors.textSecondary },
		tile: { width: GRID_CARD_WIDTH, marginBottom: theme.spacing.lg },
		tileCover: { borderRadius: 8 },
		tileBadge: { position: 'absolute', top: 8, right: 8, paddingVertical: 3 },
		tileInfo: { marginTop: theme.spacing.sm, paddingHorizontal: 2 },
		tileName: {
			fontSize: theme.typography.sizes.md,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
			marginBottom: 2,
		},
	});
