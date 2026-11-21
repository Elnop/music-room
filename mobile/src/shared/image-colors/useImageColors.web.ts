export { hexToRgba } from '@/shared/image-colors/lib/adaptivePalette';

export function useImageColors(imageUrl: string | null | undefined, fallbackColor: string) {
	return { dominantColor: imageUrl ? fallbackColor : null, isLoading: false };
}
