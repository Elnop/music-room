import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { Text } from '@/shared/components/ui/Text';

interface NowPlayingInlineProps {
	track: {
		title: string;
		artist: string;
		artworkUrl?: string | null;
	};
	isPlaying: boolean;
	onPlay: () => void;
	onPause: () => void;
	/** False hides the play/pause button (a device I may not control). */
	controllable?: boolean;
}

/** Shows a friend's listening activity on their profile. */
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
		<View style={styles.trackCard}>
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
				<Pressable
					style={styles.playButton}
					onPress={isPlaying ? onPause : onPlay}
					accessibilityRole="button"
					accessibilityLabel={isPlaying ? 'Mettre en pause' : 'Lire'}
					hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
				>
					<Ionicons
						name={isPlaying ? 'pause' : 'play'}
						size={16}
						color={theme.colors.onColor}
						style={!isPlaying ? { marginLeft: 1 } : undefined}
					/>
				</Pressable>
			)}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		trackCard: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.surfaceAlt,
			padding: theme.spacing.sm,
			marginTop: theme.spacing.sm,
		},
		artwork: {
			width: 40,
			height: 40,
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
			fontFamily: theme.typography.families.semibold,
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
			justifyContent: 'center',
			alignItems: 'center',
		},
	});
