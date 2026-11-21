import { hexToRgba } from '@/shared/image-colors/lib/adaptivePalette';
import type { AdaptivePalette } from '@/shared/image-colors/imageColorTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { PlayerColors } from '@/features/playback/features/player-modal/playerModalTypes';

type Gradient = [string, string, string, string];

function baseColors(theme: Theme, adaptive: AdaptivePalette | null) {
	if (adaptive) {
		return {
			text: adaptive.text,
			textSecondary: adaptive.textSecondary,
			buttonBg: adaptive.buttonBg,
			slider: adaptive.accent,
			sliderBg: adaptive.accentBg,
			playBtnBg: adaptive.accent,
			playBtnIcon: adaptive.onAccent,
		};
	}
	return {
		text: theme.colors.text,
		textSecondary: theme.colors.textSecondary,
		buttonBg: theme.colors.surface,
		slider: theme.colors.primary,
		sliderBg: theme.colors.border,
		playBtnBg: theme.colors.primary,
		playBtnIcon: theme.colors.onColor,
	};
}

export function playerColors(theme: Theme, adaptive: AdaptivePalette | null): PlayerColors {
	return {
		...baseColors(theme, adaptive),
		error: theme.colors.error,
		errorBg: hexToRgba(theme.colors.error, 0.15),
	};
}

export function playerGradient(theme: Theme, adaptive: AdaptivePalette | null): Gradient {
	if (adaptive) return adaptive.gradient;
	const { background } = theme.colors;
	return [background, background, background, background];
}
