import { useFonts } from 'expo-font';
import { FONT_ASSETS } from '@/shared/theme/configs/fontsConfig';

export function useAppFontsReady(): boolean {
	const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
	return fontsLoaded || fontError !== null;
}
