import React from 'react';
import { StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import PauseSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pause-solid.svg';
import PlaySolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/play-solid.svg';

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

type NowPlayingPlayButtonProps = {
	isPlaying: boolean;
	onPlay: () => void;
	onPause: () => void;
};

export function NowPlayingPlayButton({ isPlaying, onPlay, onPause }: NowPlayingPlayButtonProps) {
	const { theme, styles } = useThemedStyles(createStyles);

	return (
		<Pressable
			style={styles.playButton}
			onPress={isPlaying ? onPause : onPlay}
			accessibilityRole="button"
			accessibilityLabel={isPlaying ? 'Mettre en pause' : 'Lire'}
			hitSlop={HIT_SLOP}
		>
			<PixelIcon
				icon={isPlaying ? PauseSolid : PlaySolid}
				size={16}
				color={theme.colors.onColor}
				style={isPlaying ? undefined : styles.playIcon}
			/>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		playButton: {
			backgroundColor: theme.colors.primary,
			width: theme.controls.iconButton,
			height: theme.controls.iconButton,
			justifyContent: 'center',
			alignItems: 'center',
		},
		playIcon: {
			marginLeft: theme.spacing.hairline,
		},
	});
	return styles;
}
