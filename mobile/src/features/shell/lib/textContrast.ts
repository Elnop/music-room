import { FIXED_COLORS } from '@/shared/theme/lib/tokens';

const DARK_TEXT = FIXED_COLORS.inkDark;
const LIGHT_TEXT = FIXED_COLORS.inkLight;

function luminance(hex: string): number {
	const [r, g, b] = [1, 3, 5].map(i => {
		const c = parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: string, b: string) => {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
};

export function textColorOn(background: string): string {
	return contrast(background, DARK_TEXT) >= contrast(background, LIGHT_TEXT)
		? DARK_TEXT
		: LIGHT_TEXT;
}

export function isDarkBackground(background: string): boolean {
	return textColorOn(background) === LIGHT_TEXT;
}
