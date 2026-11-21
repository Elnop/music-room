import { WHITE } from '@/shared/image-colors/adaptivePaletteConfig';
import { parseHex } from '@/shared/image-colors/lib/colorContrast';
import { readableSurface, secondaryAlpha } from '@/shared/image-colors/lib/readableSurface';
import type { AdaptivePalette, ReadableSurface } from '@/shared/image-colors/imageColorTypes';

export function hexToRgba(hex: string, alpha: number): string {
	const rgb = parseHex(hex);
	if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
	return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function paletteOn(surface: ReadableSurface, dominantColor: string): AdaptivePalette {
	const isWhite = surface.pole === WHITE;
	const channel = isWhite ? '255,255,255' : '0,0,0';
	const text = isWhite ? '#FFFFFF' : '#000000';
	return {
		text,
		textSecondary: `rgba(${channel},${secondaryAlpha(surface)})`,
		buttonBg: `rgba(${channel},${isWhite ? 0.2 : 0.12})`,
		accent: text,
		accentBg: `rgba(${channel},${isWhite ? 0.3 : 0.2})`,
		onAccent: isWhite ? '#000000' : '#FFFFFF',
		gradient: surface.alphas.map(a => hexToRgba(dominantColor, a)) as AdaptivePalette['gradient'],
	};
}

export function getAdaptiveColors(dominantColor: string, base: string): AdaptivePalette | null {
	const dominant = parseHex(dominantColor);
	const baseRgb = parseHex(base);
	if (!dominant || !baseRgb) return null;
	return paletteOn(readableSurface(dominant, baseRgb), dominantColor);
}
