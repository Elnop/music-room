type Rgb = [number, number, number];

const parseHex = (hex: string): Rgb | null => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) return null;
	return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
};

/**
 * Convert hex to rgba with opacity
 */
export const hexToRgba = (hex: string, alpha: number): string => {
	const rgb = parseHex(hex);
	if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
	return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
};

/** WCAG 2.x relative luminance of an sRGB colour (channels 0–255). */
const relativeLuminance = ([r, g, b]: Rgb): number => {
	const lin = (c: number) => {
		const v = c / 255;
		return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

/** WCAG contrast ratio between two opaque colours, from 1 to 21. */
export const contrastRatio = (a: Rgb, b: Rgb): number => {
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/** The opaque colour seen when `color` at opacity `alpha` is drawn over `base`. */
export const compositeOver = (color: Rgb, alpha: number, base: Rgb): Rgb => [
	color[0] * alpha + base[0] * (1 - alpha),
	color[1] * alpha + base[1] * (1 - alpha),
	color[2] * alpha + base[2] * (1 - alpha),
];

/** WCAG AA for normal text. */
export const MIN_TEXT_CONTRAST = 4.5;

/** Opacities of the player gradient stops, top to bottom, drawn over the theme background. */
export const GRADIENT_ALPHAS = [0.95, 0.7, 0.5, 0.4] as const;

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];

/** Smallest secondary-text opacity tried: below it the text no longer reads as text. */
const SECONDARY_MIN_ALPHA = 0.7;
const SECONDARY_ALPHA_STEP = 0.05;

interface AdaptivePalette {
	text: string;
	textSecondary: string;
	buttonBg: string;
	accent: string;
	accentBg: string;
	/** Icon colour over `accent` (the play button). */
	onAccent: string;
	gradient: [string, string, string, string];
}

/**
 * Opacities from the bottom stop to the top one, every 0.05: between stops the
 * gradient blends linearly, and luminance along that blend is not always monotonic.
 */
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

/**
 * Colours for content drawn over the player gradient: the dominant artwork colour
 * at `GRADIENT_ALPHAS` over the theme background `base`. Text is black or white,
 * whichever keeps the best contrast on every stop; when neither reaches WCAG AA,
 * the gradient becomes opaque, where one of them always does (≥ 4.58:1).
 * Returns null when a colour is not `#RRGGBB`.
 */
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

	// Lowest opacity of the secondary text that keeps AA on every stop.
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
