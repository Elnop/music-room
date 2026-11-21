import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';
import PauseSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pause-solid.svg';
import PlaySolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/play-solid.svg';
import SoundMuteSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/sound-mute-solid.svg';
import SoundOnSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/sound-on-solid.svg';

type NowPlayingInlineProps = {
	track: {
		title: string;
		artist: string;
		artworkUrl?: string | null;
	};
	isPlaying: boolean;
	onPlay: () => void;
	onPause: () => void;
	controllable?: boolean;
};

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
					<PixelIcon icon={MusicSolid} size={18} color={theme.colors.textSecondary} />
				</View>
			)}

			<View style={styles.trackInfo}>
				<View style={styles.titleRow}>
					<PixelIcon
						icon={isPlaying ? SoundOnSolid : SoundMuteSolid}
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
					<PixelIcon
						icon={isPlaying ? PauseSolid : PlaySolid}
						size={16}
						color={theme.colors.onColor}
						style={!isPlaying ? { marginLeft: 1 } : undefined}
					/>
				</Pressable>
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
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
	return styles;
}
