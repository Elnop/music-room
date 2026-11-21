import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type TrackPhoneArtworkProps = {
	uri?: string;
	unavailable: boolean;
};

export function TrackPhoneArtwork({ uri, unavailable }: TrackPhoneArtworkProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	if (uri) {
		return <Image source={{ uri }} style={[styles.albumArt, unavailable && styles.unavailable]} />;
	}
	return (
		<View style={[styles.albumArt, styles.albumArtPlaceholder, unavailable && styles.unavailable]}>
			<PixelIcon icon={MusicSolid} color={theme.colors.textSecondary} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		albumArt: {
			width: theme.controls.trackArtwork,
			height: theme.controls.trackArtwork,
		},
		albumArtPlaceholder: {
			backgroundColor: theme.colors.border,
			justifyContent: 'center',
			alignItems: 'center',
		},
		unavailable: {
			opacity: 0.4,
		},
	});
	return styles;
}
