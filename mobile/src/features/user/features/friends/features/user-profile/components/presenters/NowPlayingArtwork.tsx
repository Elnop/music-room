import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type NowPlayingArtworkProps = {
	artworkUrl?: string | null;
};

export function NowPlayingArtwork({ artworkUrl }: NowPlayingArtworkProps) {
	const { theme, styles } = useThemedStyles(createStyles);

	if (artworkUrl) {
		return <Image source={{ uri: artworkUrl }} style={styles.artwork} />;
	}
	return (
		<View style={[styles.artwork, styles.artworkPlaceholder]}>
			<PixelIcon icon={MusicSolid} size={18} color={theme.colors.textSecondary} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		artwork: {
			width: theme.controls.thumbnail,
			height: theme.controls.thumbnail,
			backgroundColor: theme.colors.surface,
		},
		artworkPlaceholder: {
			justifyContent: 'center',
			alignItems: 'center',
		},
	});
	return styles;
}
