import { useEffect, useState } from 'react';
import { extractDominantColor } from '@/shared/image-colors/lib/extractDominantColor';

export { hexToRgba } from '@/shared/image-colors/lib/adaptivePalette';

type ColorTarget = {
	isMounted: () => boolean;
	setColor: (color: string | null) => void;
	setLoading: (loading: boolean) => void;
};

async function loadDominantColor(
	imageUrl: string | null | undefined,
	fallbackColor: string,
	target: ColorTarget,
): Promise<void> {
	if (!imageUrl) {
		target.setColor(null);
		return;
	}
	target.setLoading(true);
	try {
		const color = await extractDominantColor(imageUrl, fallbackColor);
		if (target.isMounted()) target.setColor(color);
	} catch {
		if (target.isMounted()) target.setColor(null);
	} finally {
		if (target.isMounted()) target.setLoading(false);
	}
}

export function useImageColors(imageUrl: string | null | undefined, fallbackColor: string) {
	const [dominantColor, setDominantColor] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		let isMounted = true;
		loadDominantColor(imageUrl, fallbackColor, {
			isMounted: () => isMounted,
			setColor: setDominantColor,
			setLoading: setIsLoading,
		});
		return () => {
			isMounted = false;
		};
	}, [imageUrl, fallbackColor]);

	return { dominantColor, isLoading };
}
