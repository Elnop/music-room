import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@/themes/types';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

interface Props {
	track: SoundCloudTrack;
	onPlay: (track: SoundCloudTrack) => void;
	onAddToPlaylist: (track: SoundCloudTrack) => void;
}

export function SoundCloudTrackItem({ track, onPlay, onAddToPlaylist }: Props) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const formatDuration = (ms: number) => {
		const minutes = Math.floor(ms / 60000);
		const seconds = Math.floor((ms % 60000) / 1000);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	};

	const artworkUrl = track.artwork_url || track.user.avatar_url || 'https://via.placeholder.com/50';

	return (
		<TouchableOpacity style={styles.container} onPress={() => onPlay(track)} activeOpacity={0.6}>
			<Image source={{ uri: artworkUrl }} style={styles.artwork} />
			<View style={styles.info}>
				<Text style={styles.title} numberOfLines={1}>
					{track.title}
				</Text>
				<Text style={styles.artist} numberOfLines={1}>
					{track.user.username}
				</Text>
			</View>
			<Text style={styles.duration}>{formatDuration(track.duration)}</Text>
			<TouchableOpacity
				style={styles.addButton}
				onPress={e => {
					e.stopPropagation();
					onAddToPlaylist(track);
				}}
				hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
			>
				<Ionicons name="add" size={24} color={theme.colors.primary} />
			</TouchableOpacity>
		</TouchableOpacity>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: 8,
			paddingHorizontal: theme.spacing.md,
		},
		artwork: {
			width: 48,
			height: 48,
			borderRadius: 4,
			backgroundColor: theme.colors.surfaceAlt,
		},
		info: {
			flex: 1,
			marginLeft: theme.spacing.md,
		},
		title: {
			fontSize: theme.typography.sizes.md,
			fontWeight: theme.typography.weights.medium,
			color: theme.colors.text,
			marginBottom: 2,
		},
		artist: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		duration: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginRight: theme.spacing.sm,
		},
		addButton: {
			width: 40,
			height: 40,
			borderRadius: 20,
			alignItems: 'center',
			justifyContent: 'center',
		},
	});
