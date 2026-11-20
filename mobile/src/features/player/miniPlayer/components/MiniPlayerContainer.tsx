import React from 'react';
import { GestureDetector } from 'react-native-gesture-handler';
import { useMiniPlayer } from '@/features/player/miniPlayer/useMiniPlayer';
import { MiniPlayerView } from '@/features/player/miniPlayer/components/presenters/MiniPlayerView';

export function MiniPlayerContainer() {
	const data = useMiniPlayer();

	return (
		<GestureDetector gesture={data.panGesture}>
			<MiniPlayerView data={data} />
		</GestureDetector>
	);
}
