export { hexToRgba } from '@/shared/theme/adaptivePalette';

/** Browser variant: no colour extraction, a cover gets the fallback, as a failed extraction does natively. */
export function useImageColors(imageUrl: string | null | undefined, fallbackColor: string) {
	return { dominantColor: imageUrl ? fallbackColor : null, isLoading: false };
}
