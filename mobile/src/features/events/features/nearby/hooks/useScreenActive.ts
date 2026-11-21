import { useIsFocused } from '@react-navigation/native';
import { useAppActive } from '@/features/events/features/nearby/hooks/useAppActive';

export function useScreenActive(): boolean {
	const isFocused = useIsFocused();
	const appActive = useAppActive();
	return isFocused && appActive;
}
