import { useWindowDimensions } from 'react-native';
import { artworkSize } from '@/features/playback/features/player-modal/lib/playerLayout';

export function useArtworkSize() {
	const { width, height } = useWindowDimensions();
	return artworkSize(width, height);
}
