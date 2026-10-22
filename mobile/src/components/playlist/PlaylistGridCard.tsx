import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import type { Playlist } from '@/types/playlist.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (SCREEN_WIDTH - 48 - CARD_MARGIN) / 2;

interface PlaylistGridCardProps {
	playlist: Playlist;
	onPress: () => void;
	showOwner?: boolean;
}

export function PlaylistGridCard({ playlist, onPress, showOwner }: PlaylistGridCardProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const coverUrl = playlist.coverUrl || playlist.firstTrackCover;

	return (
		<TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.6}>
			<View style={styles.coverContainer}>
				{coverUrl ? (
					<Image source={{ uri: coverUrl }} style={styles.cover} />
				) : (
					<View style={[styles.cover, styles.emptyCover]}>
						<Ionicons name="musical-notes" size={32} color={theme.colors.textSecondary} />
					</View>
				)}

				{/* Private badge */}
				{playlist.visibility === 'private' && (
					<View style={styles.privateBadge}>
						<Ionicons name="lock-closed" size={10} color={theme.colors.textSecondary} />
					</View>
				)}
			</View>

			<View style={styles.info}>
				<Text style={styles.name} numberOfLines={1}>
					{playlist.name}
				</Text>
				<Text style={styles.meta} numberOfLines={1}>
					{showOwner && playlist.owner
						? `par ${playlist.owner.displayName || playlist.owner.username}`
						: `${playlist.trackCount} ${playlist.trackCount === 1 ? 'titre' : 'titres'}`}
				</Text>
			</View>
		</TouchableOpacity>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			width: CARD_WIDTH,
			marginBottom: theme.spacing.lg,
		},
		coverContainer: {
			position: 'relative',
			width: '100%',
			aspectRatio: 1,
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
		privateBadge: {
			position: 'absolute',
			top: 8,
			right: 8,
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.surfaceAlt,
			paddingHorizontal: 6,
			paddingVertical: 3,
			borderRadius: 8,
		},
		info: {
			marginTop: theme.spacing.sm,
			paddingHorizontal: 2,
		},
		name: {
			fontSize: theme.typography.sizes.md,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
			marginBottom: 2,
		},
		meta: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
