import { PixelifySans_400Regular } from '@expo-google-fonts/pixelify-sans/400Regular';
import { PixelifySans_500Medium } from '@expo-google-fonts/pixelify-sans/500Medium';
import { PixelifySans_600SemiBold } from '@expo-google-fonts/pixelify-sans/600SemiBold';
import { PixelifySans_700Bold } from '@expo-google-fonts/pixelify-sans/700Bold';
import { Silkscreen_400Regular } from '@expo-google-fonts/silkscreen/400Regular';

/**
 * One family per weight, never a fontWeight: Android picks the weight by family.
 * Pixelify Sans stops at bold, so `extrabold` reuses it; Silkscreen draws numbers and code.
 */
export const FONT_FAMILIES = {
	regular: 'PixelifySans_400Regular',
	medium: 'PixelifySans_500Medium',
	semibold: 'PixelifySans_600SemiBold',
	bold: 'PixelifySans_700Bold',
	extrabold: 'PixelifySans_700Bold',
	mono: 'Silkscreen_400Regular',
} as const;

/** What `App.tsx` loads before the first render, keyed by family name. */
export const FONT_ASSETS = {
	[FONT_FAMILIES.regular]: PixelifySans_400Regular,
	[FONT_FAMILIES.medium]: PixelifySans_500Medium,
	[FONT_FAMILIES.semibold]: PixelifySans_600SemiBold,
	[FONT_FAMILIES.bold]: PixelifySans_700Bold,
	[FONT_FAMILIES.mono]: Silkscreen_400Regular,
};
