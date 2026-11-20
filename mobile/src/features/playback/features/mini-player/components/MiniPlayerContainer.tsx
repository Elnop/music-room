import React from 'react';
import { GestureDetector } from 'react-native-gesture-handler';
import { useMiniPlayer } from '@/features/playback/features/mini-player/useMiniPlayer';
import { MiniPlayerView } from '@/features/playback/features/mini-player/components/presenters/MiniPlayerView';

export function MiniPlayerContainer() {
	const data = useMiniPlayer();

	return (
		<GestureDetector gesture={data.panGesture}>
			<MiniPlayerView data={data} />
		</GestureDetector>
	);
}
