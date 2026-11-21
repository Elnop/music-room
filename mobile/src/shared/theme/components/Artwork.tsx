import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { squareStyle } from '@/shared/theme/lib/squareStyle';
import type { Theme } from '@/shared/theme/types/themeTypes';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type ArtworkProps = {
	uri?: string | null;
	size: number;
	style?: StyleProp<ViewStyle>;
	iconSize?: number;
};

export function Artwork({ uri, size, style, iconSize }: ArtworkProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={[styles.frame, squareStyle(size), style]}>
			{uri ? (
				<Image source={{ uri }} style={styles.image} testID="artwork-image" />
			) : (
				<PixelIcon
					icon={MusicSolid}
					size={iconSize ?? Math.round(size * 0.4)}
					color={theme.colors.textSecondary}
					testID="artwork-placeholder"
				/>
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		frame: {
			overflow: 'hidden',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: theme.colors.surfaceAlt,
		},
		image: {
			width: '100%',
			height: '100%',
		},
	});
	return styles;
}
