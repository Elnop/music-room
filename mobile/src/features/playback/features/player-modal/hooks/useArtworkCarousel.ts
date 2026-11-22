import { useLayoutEffect } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { hapticTap } from '@/shared/theme/lib/haptics';
import { queueStore } from '@/features/playback/shared/player/stores/queueStore';
import { useActiveQueue } from '@/features/playback/shared/player/hooks/useActiveQueue';
import { carouselView } from '@/features/playback/features/player-modal/lib/carouselView';
import { carouselPanGesture } from '@/features/playback/features/player-modal/lib/carouselPanGesture';
import { recenterCarousel } from '@/features/playback/features/player-modal/lib/recenterCarousel';
import { useArtworkSize } from '@/features/playback/features/player-modal/hooks/useArtworkSize';
import type { NowPlayingTrack } from '@/features/playback/shared/player/types/playerTypes';
import type { ArtworkCarousel } from '@/features/playback/features/player-modal/playerModalTypes';

function stepQueue(direction: 'next' | 'previous') {
	hapticTap();
	void (direction === 'next' ? queueStore.getState().next() : queueStore.getState().previous());
}

export function useArtworkCarousel(
	track: NowPlayingTrack | null,
	artworkUrl: string | null
): ArtworkCarousel {
	const artwork = useArtworkSize();
	const view = carouselView(useActiveQueue(), { track, artworkUrl });
	const center = useSharedValue(view.anchor);
	const drag = useSharedValue(0);

	useLayoutEffect(() => {
		recenterCarousel(center, view.anchor);
	}, [view.anchor, center]);

	return {
		slots: view.slots,
		center,
		drag,
		hasPrevious: view.hasPrevious,
		hasNext: view.hasNext,
		panGesture: carouselPanGesture({ center, drag, step: artwork.step }, view, stepQueue),
		artworkSize: artwork.size,
		artworkStep: artwork.step,
	};
}
