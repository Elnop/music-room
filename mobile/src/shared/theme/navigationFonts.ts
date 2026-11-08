import type { Theme as NavigationTheme } from '@react-navigation/native';
import { FONT_FAMILIES } from './fonts';

export const NAVIGATION_FONTS: NavigationTheme['fonts'] = {
	regular: { fontFamily: FONT_FAMILIES.regular, fontWeight: 'normal' },
	medium: { fontFamily: FONT_FAMILIES.medium, fontWeight: 'normal' },
	bold: { fontFamily: FONT_FAMILIES.semibold, fontWeight: 'normal' },
	heavy: { fontFamily: FONT_FAMILIES.bold, fontWeight: 'normal' },
};
