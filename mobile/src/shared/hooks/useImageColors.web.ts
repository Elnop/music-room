export { hexToRgba } from '@/shared/theme/adaptivePalette';

export function useImageColors(imageUrl: string | null | undefined, fallbackColor: string) {
	return { dominantColor: imageUrl ? fallbackColor : null, isLoading: false };
}
