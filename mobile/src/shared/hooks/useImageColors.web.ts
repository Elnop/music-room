export { hexToRgba } from '@/shared/theme/adaptivePalette';

/** No colour extraction in a browser: a cover gets the fallback, as a failed extraction does. */
export function useImageColors(imageUrl: string | null | undefined, fallbackColor: string) {
	return { dominantColor: imageUrl ? fallbackColor : null, isLoading: false };
}
