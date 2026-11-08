import React from 'react';
import { View, Image, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { useTheme } from '@/shared/theme/ThemeContext';

interface ArtworkProps {
	uri?: string | null;
	size: number;
	style?: StyleProp<ViewStyle>;
	iconSize?: number;
}

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
					name="note"
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
