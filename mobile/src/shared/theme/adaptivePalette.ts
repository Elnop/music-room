type Rgb = [number, number, number];

const parseHex = (hex: string): Rgb | null => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) return null;
	return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
};

export const hexToRgba = (hex: string, alpha: number): string => {
	const rgb = parseHex(hex);
	if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
	return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
};

const relativeLuminance = ([r, g, b]: Rgb): number => {
	const lin = (c: number) => {
		const v = c / 255;
		return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

export const contrastRatio = (a: Rgb, b: Rgb): number => {
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

export const compositeOver = (color: Rgb, alpha: number, base: Rgb): Rgb => [
	color[0] * alpha + base[0] * (1 - alpha),
	color[1] * alpha + base[1] * (1 - alpha),
	color[2] * alpha + base[2] * (1 - alpha),
];

export const MIN_TEXT_CONTRAST = 4.5;

export const GRADIENT_ALPHAS = [0.95, 0.7, 0.5, 0.4] as const;

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];

const SECONDARY_MIN_ALPHA = 0.7;
const SECONDARY_ALPHA_STEP = 0.05;

interface AdaptivePalette {
	text: string;
	textSecondary: string;
	buttonBg: string;
	accent: string;
	accentBg: string;
	onAccent: string;
	gradient: [string, string, string, string];
}

const gradientSamples = (): number[] => {
	const low = Math.min(...GRADIENT_ALPHAS);
	const high = Math.max(...GRADIENT_ALPHAS);
	const samples: number[] = [];
	for (let a = low; a < high; a += 0.05) samples.push(a);
	samples.push(high);
	return samples;
};

const worstContrast = (fg: Rgb, backgrounds: Rgb[]) =>
	Math.min(...backgrounds.map(bg => contrastRatio(fg, bg)));

export const getAdaptiveColors = (dominantColor: string, base: string): AdaptivePalette | null => {
	const dominant = parseHex(dominantColor);
	const baseRgb = parseHex(base);
	if (!dominant || !baseRgb) return null;

	let alphas: readonly number[] = GRADIENT_ALPHAS;
	let backgrounds = gradientSamples().map(a => compositeOver(dominant, a, baseRgb));
	const pick = () =>
		worstContrast(WHITE, backgrounds) >= worstContrast(BLACK, backgrounds) ? WHITE : BLACK;

	let pole = pick();
	if (worstContrast(pole, backgrounds) < MIN_TEXT_CONTRAST) {
		alphas = GRADIENT_ALPHAS.map(() => 1);
		backgrounds = [dominant];
		pole = pick();
	}

	let secondaryAlpha = 1;
	for (let a = SECONDARY_MIN_ALPHA; a < 1; a += SECONDARY_ALPHA_STEP) {
		const rounded = Math.round(a * 100) / 100;
		if (
			backgrounds.every(
				bg => contrastRatio(compositeOver(pole, rounded, bg), bg) >= MIN_TEXT_CONTRAST
			)
		) {
			secondaryAlpha = rounded;
			break;
		}
	}

	const isWhite = pole === WHITE;
	const channel = isWhite ? '255,255,255' : '0,0,0';
	const text = isWhite ? '#FFFFFF' : '#000000';
	return {
		text,
		textSecondary: `rgba(${channel},${secondaryAlpha})`,
		buttonBg: `rgba(${channel},${isWhite ? 0.2 : 0.12})`,
		accent: text,
		accentBg: `rgba(${channel},${isWhite ? 0.3 : 0.2})`,
		onAccent: isWhite ? '#000000' : '#FFFFFF',
		gradient: alphas.map(a => hexToRgba(dominantColor, a)) as AdaptivePalette['gradient'],
	};
};
