import React from 'react';
import { View, Image, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';

interface ArtworkProps {
	uri?: string | null;
	/** Width and height, in points. */
	size: number;
	/** Applied to the square frame (radius, margins, background). */
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
				<Ionicons
					name="musical-notes"
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
