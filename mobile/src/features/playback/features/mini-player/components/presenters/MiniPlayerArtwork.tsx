import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Artwork } from '@/shared/theme/components/Artwork';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { NowPlayingTrack } from '@/features/playback/shared/player/types/playerTypes';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type MiniPlayerArtworkProps = {
	track: NowPlayingTrack | null;
};

export function MiniPlayerArtwork({ track }: MiniPlayerArtworkProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	if (!track) {
		return (
			<View style={[styles.artwork, styles.emptyArtwork]}>
				<PixelIcon icon={MusicSolid} color={theme.colors.textSecondary} />
			</View>
		);
	}
	return (
		<Artwork
			uri={track.artworkUrl}
			size={theme.controls.thumbnail}
			style={styles.artwork}
			iconSize={20}
		/>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		artwork: {
			...pixelFrame(theme),
			width: theme.controls.thumbnail,
			height: theme.controls.thumbnail,
			marginRight: theme.spacing.sm,
			backgroundColor: theme.colors.surfaceAlt,
		},
		emptyArtwork: {
			backgroundColor: theme.colors.surface,
			alignItems: 'center',
			justifyContent: 'center',
		},
	});
	return styles;
}
