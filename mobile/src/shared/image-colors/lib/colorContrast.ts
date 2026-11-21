import type { Rgb } from '@/shared/image-colors/imageColorTypes';

export function parseHex(hex: string): Rgb | null {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/iu.exec(hex);
	if (!result) return null;
	return [
		Number.parseInt(result[1], 16),
		Number.parseInt(result[2], 16),
		Number.parseInt(result[3], 16),
	];
}

function relativeLuminance([r, g, b]: Rgb): number {
	function lin(c: number) {
		const v = c / 255;
		return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	}
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function compositeOver(color: Rgb, alpha: number, base: Rgb): Rgb {
	return [
		color[0] * alpha + base[0] * (1 - alpha),
		color[1] * alpha + base[1] * (1 - alpha),
		color[2] * alpha + base[2] * (1 - alpha),
	];
}

export function worstContrast(fg: Rgb, backgrounds: Rgb[]): number {
	return Math.min(...backgrounds.map(bg => contrastRatio(fg, bg)));
}
