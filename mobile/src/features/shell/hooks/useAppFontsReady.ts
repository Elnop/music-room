import { useFonts } from 'expo-font';
import { FONT_ASSETS } from '@/shared/theme/lib/fonts';

export function useAppFontsReady(): boolean {
	const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
	return fontsLoaded || fontError !== null;
}
