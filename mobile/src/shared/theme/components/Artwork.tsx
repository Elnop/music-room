import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type ArtworkProps = {
	uri?: string | null;
	size: number;
	style?: StyleProp<ViewStyle>;
	iconSize?: number;
};

export function Artwork({ uri, size, style, iconSize }: ArtworkProps) {
	const { theme } = useTheme();

	return (
		<View
			style={[
				styles.frame,
				{ width: size, height: size, backgroundColor: theme.colors.surfaceAlt },
				style,
			]}
		>
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

const styles = StyleSheet.create({
	frame: {
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
	},
	image: {
		width: '100%',
		height: '100%',
	},
});
