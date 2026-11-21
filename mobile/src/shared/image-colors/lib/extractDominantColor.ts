import { Platform } from 'react-native';
import { getColors } from 'react-native-image-colors';
import type { ImageColorsResult } from 'react-native-image-colors';

function dominantColorOf(colors: ImageColorsResult): string | null {
	if (Platform.OS === 'ios' && colors.platform === 'ios') {
		return colors.primary || colors.background;
	}
	if (Platform.OS === 'android' && colors.platform === 'android') {
		return colors.dominant || colors.vibrant;
	}
	if (colors.platform === 'web') return colors.dominant || colors.vibrant;
	return null;
}

export async function extractDominantColor(
	imageUrl: string,
	fallbackColor: string
): Promise<string | null> {
	const colors = await getColors(imageUrl, { fallback: fallbackColor, cache: true, key: imageUrl });
	return dominantColorOf(colors);
}
