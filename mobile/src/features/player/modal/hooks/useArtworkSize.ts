import { useWindowDimensions } from 'react-native';
import { artworkSize } from '@/features/player/modal/components/presenters/playerModalStyles';

export function useArtworkSize() {
	const { width, height } = useWindowDimensions();
	return artworkSize(width, height);
}
