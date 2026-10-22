import {
	compositeOver,
	contrastRatio,
	getAdaptiveColors,
	GRADIENT_ALPHAS,
	MIN_TEXT_CONTRAST,
} from './adaptivePalette';

type Rgb = [number, number, number];

const hex = (value: string): Rgb => [
	parseInt(value.slice(1, 3), 16),
	parseInt(value.slice(3, 5), 16),
	parseInt(value.slice(5, 7), 16),
];

/** `rgba(r,g,b,a)` → its colour and opacity. */
const rgba = (value: string): { rgb: Rgb; alpha: number } => {
	const parts = /rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/.exec(value);
	if (!parts) throw new Error(`not rgba: ${value}`);
	return {
		rgb: [Number(parts[1]), Number(parts[2]), Number(parts[3])],
		alpha: Number(parts[4]),
	};
};

const THEME_BACKGROUNDS = ['#0D0D0D', '#FEFCE8', '#F8FAFC', '#FFFBEB'];
const ARTWORK_COLORS = ['#F5F5F5', '#0A0A0A', '#808080'];

describe('getAdaptiveColors', () => {
	describe.each(THEME_BACKGROUNDS)('over the %s theme background', base => {
		it.each(ARTWORK_COLORS)('keeps text and secondary text at AA over %s artwork', dominant => {
			const palette = getAdaptiveColors(dominant, base);
			if (!palette) throw new Error('no palette');

			// The gradient as drawn: each stop composited over the theme background.
			const ends = [palette.gradient[0], palette.gradient[3]].map(stop => {
				const { rgb, alpha } = rgba(stop);
				return compositeOver(rgb, alpha, hex(base));
			});
			const text = hex(palette.text);
			const secondary = rgba(palette.textSecondary);

			for (const bg of ends) {
				expect(contrastRatio(text, bg)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
				const seen = compositeOver(secondary.rgb, secondary.alpha, bg);
				expect(contrastRatio(seen, bg)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
			}
		});
	});

	it('keeps the translucent gradient when the text reaches AA on it', () => {
		const palette = getAdaptiveColors('#0A0A0A', '#0D0D0D');
		expect(palette?.text).toBe('#FFFFFF');
		expect(palette?.gradient.map(stop => rgba(stop).alpha)).toEqual([...GRADIENT_ALPHAS]);
	});

	it('turns the gradient opaque when no text colour reaches AA on both ends', () => {
		// Light artwork fading into a dark theme: black fails at the bottom, white at the top.
		const palette = getAdaptiveColors('#F5F5F5', '#0D0D0D');
		expect(palette?.gradient.map(stop => rgba(stop).alpha)).toEqual([1, 1, 1, 1]);
		expect(palette?.text).toBe('#000000');
	});

	it('draws the play icon in the opposite colour of the accent', () => {
		expect(getAdaptiveColors('#0A0A0A', '#0D0D0D')).toMatchObject({
			accent: '#FFFFFF',
			onAccent: '#000000',
		});
		expect(getAdaptiveColors('#F5F5F5', '#FEFCE8')).toMatchObject({
			accent: '#000000',
			onAccent: '#FFFFFF',
		});
	});

	it('returns null for a colour that is not #RRGGBB', () => {
		expect(getAdaptiveColors('red', '#0D0D0D')).toBeNull();
	});
});
