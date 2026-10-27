import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';

/**
 * One family per weight, never a fontWeight: Android picks the weight by family,
 * and the browser would fake a bolder weight on top of the family.
 */
export const FONT_FAMILIES = {
	regular: 'Inter_400Regular',
	medium: 'Inter_500Medium',
	semibold: 'Inter_600SemiBold',
	bold: 'Inter_700Bold',
	extrabold: 'Inter_800ExtraBold',
	mono: 'monospace',
} as const;

/** What `App.tsx` loads before the first render, keyed by family name. */
export const FONT_ASSETS = {
	[FONT_FAMILIES.regular]: Inter_400Regular,
	[FONT_FAMILIES.medium]: Inter_500Medium,
	[FONT_FAMILIES.semibold]: Inter_600SemiBold,
	[FONT_FAMILIES.bold]: Inter_700Bold,
	[FONT_FAMILIES.extrabold]: Inter_800ExtraBold,
};
