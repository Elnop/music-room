import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getColors } from 'react-native-image-colors';

export { hexToRgba } from '@/shared/theme/adaptivePalette';

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
			} catch {
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
