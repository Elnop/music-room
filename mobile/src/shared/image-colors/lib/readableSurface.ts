import {
	BLACK,
	GRADIENT_ALPHAS,
	MIN_TEXT_CONTRAST,
	SECONDARY_ALPHA_STEP,
	SECONDARY_MIN_ALPHA,
	WHITE,
} from '@/shared/image-colors/adaptivePaletteConfig';
import {
	compositeOver,
	contrastRatio,
	worstContrast,
} from '@/shared/image-colors/lib/colorContrast';
import type { ReadableSurface, Rgb } from '@/shared/image-colors/imageColorTypes';

function gradientSamples(): number[] {
	const low = Math.min(...GRADIENT_ALPHAS);
	const high = Math.max(...GRADIENT_ALPHAS);
	const samples: number[] = [];
	for (let a = low; a < high; a += 0.05) samples.push(a);
	samples.push(high);
	return samples;
}

function pickPole(backgrounds: Rgb[]): Rgb {
	return worstContrast(WHITE, backgrounds) >= worstContrast(BLACK, backgrounds) ? WHITE : BLACK;
}

export function readableSurface(dominant: Rgb, base: Rgb): ReadableSurface {
	const backgrounds = gradientSamples().map((a) => compositeOver(dominant, a, base));
	const pole = pickPole(backgrounds);
	if (worstContrast(pole, backgrounds) >= MIN_TEXT_CONTRAST) {
		return { alphas: GRADIENT_ALPHAS, backgrounds, pole };
	}
	return {
		alphas: GRADIENT_ALPHAS.map(() => 1),
		backgrounds: [dominant],
		pole: pickPole([dominant]),
	};
}

export function secondaryAlpha({ backgrounds, pole }: ReadableSurface): number {
	for (let a = SECONDARY_MIN_ALPHA; a < 1; a += SECONDARY_ALPHA_STEP) {
		const rounded = Math.round(a * 100) / 100;
		if (
			backgrounds.every(
				(bg) => contrastRatio(compositeOver(pole, rounded, bg), bg) >= MIN_TEXT_CONTRAST,
			)
		) {
			return rounded;
		}
	}
	return 1;
}
