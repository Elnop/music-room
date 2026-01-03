import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@components/common/Avatar';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import type { PlaylistWithTracks } from '@/types/playlist.types';

interface PlaylistHeaderProps {
	playlist: PlaylistWithTracks;
	onAddTrack?: () => void;
	canEdit?: boolean;
}

export function PlaylistHeader({ playlist, onAddTrack, canEdit = false }: PlaylistHeaderProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const firstTrackCover = playlist.tracks[0]?.albumArt;
	const coverUrl = playlist.coverUrl || firstTrackCover;
	const trackCount = playlist.tracks.length;

	return (
		<View style={styles.container}>
			{coverUrl ? (
				<Image source={{ uri: coverUrl }} style={styles.cover} />
			) : (
				<View style={[styles.cover, styles.emptyCover]}>
					<Ionicons name="musical-notes" size={64} color={theme.colors.textSecondary} />
				</View>
			)}
			<Text style={styles.name}>{playlist.name}</Text>
			{playlist.description && <Text style={styles.description}>{playlist.description}</Text>}
			<View style={styles.meta}>
				<Avatar uri={playlist.owner.avatarUrl} name={playlist.owner.displayName} size="sm" />
				<Text style={styles.owner}>{playlist.owner.displayName || playlist.owner.username}</Text>
				<Text style={styles.separator}>•</Text>
				<Text style={styles.trackCount}>
					{trackCount} {trackCount === 1 ? 'titre' : 'titres'}
				</Text>
			</View>
			{playlist.collaboratorIds.length > 0 && (
				<View style={styles.collaborators}>
					<Ionicons name="people-outline" size={14} color={theme.colors.primary} />
					<Text style={styles.collaboratorsText}>
						{playlist.collaboratorIds.length}{' '}
						{playlist.collaboratorIds.length === 1 ? 'collaborateur' : 'collaborateurs'}
					</Text>
				</View>
			)}

			{/* Add track button integrated in header */}
			{canEdit && onAddTrack && (
				<TouchableOpacity style={styles.addTrackRow} onPress={onAddTrack} activeOpacity={0.6}>
					<View style={styles.addTrackIcon}>
						<Ionicons name="add" size={24} color={theme.colors.textSecondary} />
					</View>
					<Text style={styles.addTrackText}>Ajouter un titre</Text>
				</TouchableOpacity>
			)}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			alignItems: 'center',
			padding: theme.spacing.lg,
			paddingBottom: 0,
		},
		cover: {
			width: 200,
			height: 200,
			borderRadius: 8,
			backgroundColor: theme.colors.surfaceAlt,
			marginBottom: theme.spacing.lg,
			// Add shadow for depth
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 8 },
			shadowOpacity: 0.3,
			shadowRadius: 12,
			elevation: 8,
		},
		emptyCover: {
			justifyContent: 'center',
			alignItems: 'center',
		},
		name: {
			fontSize: theme.typography.sizes.xxl,
			fontWeight: theme.typography.weights.bold,
			color: theme.colors.text,
			textAlign: 'center',
			marginBottom: theme.spacing.sm,
		},
		description: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
			textAlign: 'center',
			marginBottom: theme.spacing.md,
			paddingHorizontal: theme.spacing.md,
			fontWeight: theme.typography.weights.regular,
		},
		meta: {
			flexDirection: 'row',
			alignItems: 'center',
			marginTop: theme.spacing.sm,
		},
		owner: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.text,
			fontWeight: theme.typography.weights.medium,
			marginLeft: theme.spacing.sm,
		},
		separator: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginHorizontal: theme.spacing.sm,
		},
		trackCount: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		collaborators: {
			flexDirection: 'row',
			alignItems: 'center',
			marginTop: theme.spacing.sm,
			gap: theme.spacing.xs,
		},
		collaboratorsText: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.primary,
			fontWeight: theme.typography.weights.semibold,
		},
		addTrackRow: {
			flexDirection: 'row',
			alignItems: 'center',
			alignSelf: 'stretch',
			marginTop: 0,
			paddingVertical: 8,
			paddingHorizontal: theme.spacing.md,
			marginHorizontal: -theme.spacing.lg,
		},
		addTrackIcon: {
			width: 48,
			height: 48,
			borderRadius: 4,
			backgroundColor: theme.colors.surfaceAlt,
			justifyContent: 'center',
			alignItems: 'center',
		},
		addTrackText: {
			fontSize: theme.typography.sizes.md,
			fontWeight: theme.typography.weights.medium,
			color: theme.colors.textSecondary,
			marginLeft: theme.spacing.md,
		},
	});
