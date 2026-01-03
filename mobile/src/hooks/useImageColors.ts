import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getColors } from 'react-native-image-colors';

/**
 * Check if a hex color is light (for contrast purposes)
 */
export const isLightColor = (hex: string): boolean => {
	const color = hex.replace('#', '');
	if (color.length < 6) return true;
	const r = parseInt(color.substring(0, 2), 16);
	const g = parseInt(color.substring(2, 4), 16);
	const b = parseInt(color.substring(4, 6), 16);
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.5;
};

/**
 * Convert hex to rgba with opacity
 */
export const hexToRgba = (hex: string, alpha: number): string => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) return `rgba(0, 0, 0, ${alpha})`;
	const r = parseInt(result[1], 16);
	const g = parseInt(result[2], 16);
	const b = parseInt(result[3], 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Get adaptive colors that contrast with a dominant color
 */
export const getAdaptiveColors = (dominantColor: string) => {
	const isDark = !isLightColor(dominantColor);
	return {
		text: isDark ? '#FFF' : '#000',
		textSecondary: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
		buttonBg: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
		accent: isDark ? '#FFF' : '#000',
		accentBg: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
	};
};

/**
 * Hook to extract dominant color from an image URL
 */
export function useImageColors(imageUrl: string | null | undefined, fallbackColor: string) {
	const [dominantColor, setDominantColor] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		let isMounted = true;

		const extractColors = async () => {
			if (!imageUrl) {
				if (isMounted) setDominantColor(null);
				return;
			}

			setIsLoading(true);

			try {
				const colors = await getColors(imageUrl, {
					fallback: fallbackColor,
					cache: true,
					key: imageUrl,
				});

				if (!isMounted) return;

				let extractedColor: string | null = null;

				if (Platform.OS === 'ios' && colors.platform === 'ios') {
					extractedColor = colors.primary || colors.background;
				} else if (Platform.OS === 'android' && colors.platform === 'android') {
					extractedColor = colors.dominant || colors.vibrant;
				} else if (colors.platform === 'web') {
					extractedColor = colors.dominant || colors.vibrant;
				}

				setDominantColor(extractedColor);
			} catch (error) {
				if (__DEV__) {
					console.log('[useImageColors] Failed to extract colors:', error);
				}
				if (isMounted) setDominantColor(null);
			} finally {
				if (isMounted) setIsLoading(false);
			}
		};

		extractColors();

		return () => {
			isMounted = false;
		};
	}, [imageUrl, fallbackColor]);

	return { dominantColor, isLoading };
}
