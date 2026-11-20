import React from 'react';
import { View, Image, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { PixelIcon } from './PixelIcon';
import { useTheme } from './ThemeContext';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

interface ArtworkProps {
	uri?: string | null;
	size: number;
	style?: StyleProp<ViewStyle>;
	iconSize?: number;
}

/** Without a cover, a local placeholder: never a remote placeholder service. */
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
