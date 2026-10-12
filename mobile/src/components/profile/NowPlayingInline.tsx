import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';

interface NowPlayingInlineProps {
	track: {
		title: string;
		artist: string;
		artworkUrl?: string | null;
	};
	isPlaying: boolean;
	onPlay: () => void;
	onPause: () => void;
	/** False hides the play/pause button (device I may not control) */
	controllable?: boolean;
}

/**
 * Compact inline component showing currently playing track
 * Used in friend profiles to display listening activity
 */
export function NowPlayingInline({
	track,
	isPlaying,
	onPlay,
	onPause,
	controllable = true,
}: NowPlayingInlineProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={styles.container}>
			{track.artworkUrl ? (
				<Image source={{ uri: track.artworkUrl }} style={styles.artwork} />
			) : (
				<View style={[styles.artwork, styles.artworkPlaceholder]}>
					<Ionicons name="musical-note" size={18} color={theme.colors.textSecondary} />
				</View>
			)}

			<View style={styles.trackInfo}>
				<View style={styles.titleRow}>
					<Ionicons
						name={isPlaying ? 'volume-high' : 'volume-mute'}
						size={12}
						color={isPlaying ? theme.colors.primary : theme.colors.textSecondary}
						style={styles.volumeIcon}
					/>
					<Text style={styles.title} numberOfLines={1}>
						{track.title}
					</Text>
				</View>
				<Text style={styles.artist} numberOfLines={1}>
					{track.artist}
				</Text>
			</View>

			{controllable && (
				<TouchableOpacity
					style={styles.playButton}
					onPress={isPlaying ? onPause : onPlay}
					hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
				>
					<Ionicons
						name={isPlaying ? 'pause' : 'play'}
						size={16}
						color="#FFFFFF"
						style={!isPlaying ? { marginLeft: 1 } : undefined}
					/>
				</TouchableOpacity>
			)}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.surfaceAlt,
			borderRadius: 10,
			padding: theme.spacing.sm,
			marginTop: theme.spacing.sm,
		},
		artwork: {
			width: 40,
			height: 40,
			borderRadius: 6,
			backgroundColor: theme.colors.surface,
		},
		artworkPlaceholder: {
			justifyContent: 'center',
			alignItems: 'center',
		},
		trackInfo: {
			flex: 1,
			marginLeft: theme.spacing.sm,
			marginRight: theme.spacing.sm,
		},
		titleRow: {
			flexDirection: 'row',
			alignItems: 'center',
		},
		volumeIcon: {
			marginRight: 4,
		},
		title: {
			flex: 1,
			fontSize: 13,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
		},
		artist: {
			fontSize: 12,
			color: theme.colors.textSecondary,
			marginTop: 1,
		},
		playButton: {
			backgroundColor: theme.colors.primary,
			width: 32,
			height: 32,
			borderRadius: 16,
			justifyContent: 'center',
			alignItems: 'center',
		},
	});
