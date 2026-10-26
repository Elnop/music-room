import { useWindowDimensions } from 'react-native';
import { artworkSize } from '@/features/player/modal/components/presenters/playerModalStyles';

/** The player's artwork follows the window, so resizing a browser window resizes it. */
export function useArtworkSize() {
	const { width, height } = useWindowDimensions();
	return artworkSize(width, height);
}
